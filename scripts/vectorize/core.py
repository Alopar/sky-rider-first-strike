"""Raster → monochrome SVG conversion (Pillow preprocess + vtracer binary)."""

from __future__ import annotations

import re
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

from PIL import Image, ImageFilter

import vtracer

from presets import TracePreset, get_preset

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "assets" / "svg" / "ui"

SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"}
DEFAULT_CANVAS_PADDING = 10


@dataclass
class ConvertOptions:
    preset_id: str = "logo"
    max_side: int | None = None
    threshold: int | None = None  # None = Otsu
    invert: bool | None = None
    blur: bool | None = None
    filter_speckle: int | None = None
    corner_threshold: int | None = None
    length_threshold: float | None = None
    path_precision: int | None = None
    mode: str | None = None
    splice_threshold: int | None = None
    max_iterations: int | None = None
    output_dir: Path = field(default_factory=lambda: DEFAULT_OUTPUT_DIR)
    overwrite: bool = False
    on_conflict_suffix: str = "_traced"
    fit_to_canvas: bool = True  # полотно по bbox контура + отступ
    canvas_padding: int = DEFAULT_CANVAS_PADDING


@dataclass
class ConvertResult:
    input_path: Path
    output_path: Path
    width: int
    height: int
    skipped: bool = False
    message: str = ""


def repo_root() -> Path:
    return REPO_ROOT


def default_output_dir() -> Path:
    return DEFAULT_OUTPUT_DIR


def is_supported(path: Path) -> bool:
    return path.suffix.lower() in SUPPORTED_EXTENSIONS


def compute_otsu_threshold(gray: Image.Image) -> int:
    histogram = gray.histogram()
    total = sum(histogram)
    if total == 0:
        return 128

    sum_total = sum(i * histogram[i] for i in range(256))
    sum_b = 0.0
    weight_b = 0.0
    max_variance = 0.0
    threshold = 128

    for t in range(256):
        weight_b += histogram[t]
        if weight_b == 0:
            continue
        weight_f = total - weight_b
        if weight_f == 0:
            break
        sum_b += t * histogram[t]
        mean_b = sum_b / weight_b
        mean_f = (sum_total - sum_b) / weight_f
        variance = weight_b * weight_f * (mean_b - mean_f) ** 2
        if variance > max_variance:
            max_variance = variance
            threshold = t

    return int(threshold)


def resolve_options(options: ConvertOptions | None = None, **kwargs) -> ConvertOptions:
    base = options or ConvertOptions()
    for key, value in kwargs.items():
        if hasattr(base, key) and value is not None:
            setattr(base, key, value)
    return base


@dataclass
class ResolvedOptions:
    preset: TracePreset
    max_side: int
    threshold: int | None
    invert: bool
    blur: bool
    filter_speckle: int
    corner_threshold: int
    length_threshold: float
    path_precision: int
    mode: str
    splice_threshold: int
    max_iterations: int
    output_dir: Path
    overwrite: bool
    on_conflict_suffix: str
    fit_to_canvas: bool
    canvas_padding: int


def resolve_trace_options(options: ConvertOptions) -> ResolvedOptions:
    preset = get_preset(options.preset_id)

    def pick(override, default):
        return default if override is None else override

    return ResolvedOptions(
        preset=preset,
        max_side=pick(options.max_side, preset.max_side),
        threshold=pick(options.threshold, preset.threshold),
        invert=preset.invert if options.invert is None else options.invert,
        blur=preset.blur if options.blur is None else options.blur,
        filter_speckle=pick(options.filter_speckle, preset.filter_speckle),
        corner_threshold=pick(options.corner_threshold, preset.corner_threshold),
        length_threshold=pick(options.length_threshold, preset.length_threshold),
        path_precision=pick(options.path_precision, preset.path_precision),
        mode=pick(options.mode, preset.mode),
        splice_threshold=pick(options.splice_threshold, preset.splice_threshold),
        max_iterations=pick(options.max_iterations, preset.max_iterations),
        output_dir=options.output_dir.resolve(),
        overwrite=options.overwrite,
        on_conflict_suffix=options.on_conflict_suffix,
        fit_to_canvas=options.fit_to_canvas,
        canvas_padding=max(0, options.canvas_padding),
    )


def _resize_if_needed(image: Image.Image, max_side: int) -> Image.Image:
    w, h = image.size
    longest = max(w, h)
    if longest <= max_side:
        return image
    scale = max_side / longest
    new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
    return image.resize(new_size, Image.Resampling.LANCZOS)


def preprocess_to_bw(
    source: Path,
    *,
    max_side: int,
    threshold: int | None,
    invert: bool,
    blur: bool,
) -> tuple[Image.Image, int, int]:
    with Image.open(source) as img:
        img = img.convert("RGBA")
        original_size = img.size
        img = _resize_if_needed(img, max_side)
        rgba = img

    background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    background.paste(rgba, mask=rgba.split()[3])
    gray = background.convert("L")

    if blur:
        gray = gray.filter(ImageFilter.GaussianBlur(radius=1))

    thresh_value = threshold if threshold is not None else compute_otsu_threshold(gray)
    bw = gray.point(lambda p: 255 if p >= thresh_value else 0, mode="L")
    if invert:
        bw = Image.eval(bw, lambda p: 255 - p)

    return bw, original_size[0], original_size[1]


def content_bbox(bw: Image.Image) -> tuple[int, int, int, int]:
    """Bounding box непустого (тёмного) содержимого в координатах bw."""
    mask = bw.point(lambda p: 255 if p < 250 else 0, mode="L")
    box = mask.getbbox()
    if box is None:
        w, h = bw.size
        return (0, 0, w, h)
    return box  # left, top, right, bottom (right/bottom exclusive в PIL)


def _extract_svg_body(svg_text: str) -> str:
    match = re.search(r"<svg[^>]*>(.*)</svg>", svg_text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return svg_text.strip()


def _traced_size_from_svg(svg_text: str) -> tuple[int, int] | None:
    """Размеры полотна из viewBox/width/height, которые выставил vtracer."""
    view = re.search(
        r'viewBox="\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*"',
        svg_text,
        re.IGNORECASE,
    )
    if view:
        return round(float(view.group(1))), round(float(view.group(2)))

    sized = re.search(
        r'<svg[^>]*\bwidth="([\d.]+)"[^>]*\bheight="([\d.]+)"',
        svg_text,
        re.IGNORECASE,
    )
    if sized:
        return round(float(sized.group(1))), round(float(sized.group(2)))
    return None


def _output_path_for(
    input_path: Path,
    output_dir: Path,
    overwrite: bool,
    suffix: str,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    target = output_dir / f"{input_path.stem}.svg"
    if not target.exists() or overwrite:
        return target
    alt = output_dir / f"{input_path.stem}{suffix}.svg"
    if not alt.exists():
        return alt
    n = 2
    while True:
        candidate = output_dir / f"{input_path.stem}{suffix}_{n}.svg"
        if not candidate.exists():
            return candidate
        n += 1


def postprocess_svg(
    svg_text: str,
    fallback_width: int,
    fallback_height: int,
    *,
    content_size: tuple[int, int] | None = None,
    fit_to_canvas: bool = True,
    canvas_padding: int = DEFAULT_CANVAS_PADDING,
) -> tuple[str, int, int]:
    """Собирает итоговый SVG. Возвращает (текст, width, height)."""
    body = _extract_svg_body(svg_text)
    body = re.sub(r"<g>\s*</g>", "", body)

    if fit_to_canvas and content_size:
        traced = _traced_size_from_svg(svg_text)
        cw, ch = traced if traced else content_size
        cw = max(1, cw)
        ch = max(1, ch)
        pad = max(0, canvas_padding)
        width = cw + 2 * pad
        height = ch + 2 * pad
        body = f'<g transform="translate({pad} {pad})">\n{body}\n</g>'
    else:
        width = fallback_width
        height = fallback_height

    view_box = f"0 0 {width} {height}"
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width}" height="{height}" viewBox="{view_box}">\n'
        f"{body}\n"
        "</svg>"
    )
    return svg, width, height


def convert_file(
    input_path: Path,
    options: ConvertOptions | None = None,
    *,
    progress: Callable[[str], None] | None = None,
) -> ConvertResult:
    input_path = input_path.resolve()
    if not input_path.is_file():
        raise FileNotFoundError(input_path)
    if not is_supported(input_path):
        raise ValueError(f"Unsupported format: {input_path.suffix}")

    opts = resolve_options(options)
    merged = resolve_trace_options(opts)
    output_path = _output_path_for(
        input_path,
        merged.output_dir,
        merged.overwrite,
        merged.on_conflict_suffix,
    )

    log = progress or (lambda _msg: None)
    log(f"Обработка: {input_path.name}")

    bw, orig_w, orig_h = preprocess_to_bw(
        input_path,
        max_side=merged.max_side,
        threshold=merged.threshold,
        invert=merged.invert,
        blur=merged.blur,
    )

    content_size: tuple[int, int] | None = None
    if merged.fit_to_canvas:
        bbox = content_bbox(bw)
        cw = bbox[2] - bbox[0]
        ch = bbox[3] - bbox[1]
        content_size = (cw, ch)
        bw_for_trace = bw.crop(bbox)
    else:
        bw_for_trace = bw

    with tempfile.TemporaryDirectory(prefix="sky-rider-vectorize-") as tmp:
        tmp_in = Path(tmp) / "input.png"
        tmp_out = Path(tmp) / "output.svg"
        bw_for_trace.save(tmp_in, format="PNG")

        vtracer.convert_image_to_svg_py(
            str(tmp_in),
            str(tmp_out),
            colormode="binary",
            hierarchical="stacked",
            mode=merged.mode,
            filter_speckle=merged.filter_speckle,
            corner_threshold=merged.corner_threshold,
            length_threshold=merged.length_threshold,
            max_iterations=merged.max_iterations,
            splice_threshold=merged.splice_threshold,
            path_precision=merged.path_precision,
        )

        raw_svg = tmp_out.read_text(encoding="utf-8")

    final_svg, out_w, out_h = postprocess_svg(
        raw_svg,
        orig_w,
        orig_h,
        content_size=content_size,
        fit_to_canvas=merged.fit_to_canvas,
        canvas_padding=merged.canvas_padding,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(final_svg, encoding="utf-8")
    log(f"Готово: {output_path.relative_to(REPO_ROOT)} ({out_w}x{out_h})")

    return ConvertResult(
        input_path=input_path,
        output_path=output_path,
        width=out_w,
        height=out_h,
    )


def convert_files(
    paths: list[Path | str],
    options: ConvertOptions | None = None,
    *,
    progress: Callable[[str], None] | None = None,
) -> list[ConvertResult]:
    opts = resolve_options(options)
    results: list[ConvertResult] = []
    for raw in paths:
        path = Path(raw).resolve()
        try:
            results.append(convert_file(path, opts, progress=progress))
        except Exception as exc:
            msg = f"Ошибка {path.name}: {exc}"
            if progress:
                progress(msg)
            raise
    return results
