#!/usr/bin/env python3
"""CLI: raster → monochrome SVG."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from core import ConvertOptions, convert_files, default_output_dir, is_supported
from presets import preset_ids


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert raster images to monochrome SVG (assets/svg/ui/ by default)."
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        type=Path,
        help="Input image file(s)",
    )
    parser.add_argument(
        "--preset",
        choices=preset_ids(),
        default="logo",
        help="Trace preset (default: logo)",
    )
    parser.add_argument("--max-side", type=int, default=None, help="Max longest side in px")
    parser.add_argument(
        "--threshold",
        type=int,
        default=None,
        metavar="0-255",
        help="Binarization threshold (default: from preset or Otsu)",
    )
    parser.add_argument(
        "--auto-threshold",
        action="store_true",
        help="Force Otsu auto threshold",
    )
    parser.add_argument("--invert", action="store_true", help="Invert black/white")
    parser.add_argument("--blur", action="store_true", help="1px blur before threshold")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help=f"Output directory (default: {default_output_dir()})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing SVG",
    )
    parser.add_argument(
        "--no-fit-canvas",
        action="store_true",
        help="Keep full raster canvas size instead of tight bbox + padding",
    )
    parser.add_argument(
        "--canvas-padding",
        type=int,
        default=10,
        metavar="PX",
        help="Padding around traced content when fit canvas is on (default: 10)",
    )
    parser.add_argument(
        "--filter-speckle",
        type=int,
        default=None,
        help="vtracer filter_speckle",
    )
    parser.add_argument("--corner-threshold", type=int, default=None)
    parser.add_argument("--length-threshold", type=float, default=None)
    parser.add_argument("--path-precision", type=int, default=None)
    parser.add_argument("--mode", choices=["polygon", "spline", "none"], default=None)
    args = parser.parse_args()

    threshold = None if args.auto_threshold else args.threshold

    options = ConvertOptions(
        preset_id=args.preset,
        max_side=args.max_side,
        threshold=threshold,
        invert=args.invert,
        blur=args.blur,
        filter_speckle=args.filter_speckle,
        corner_threshold=args.corner_threshold,
        length_threshold=args.length_threshold,
        path_precision=args.path_precision,
        mode=args.mode,
        output_dir=args.output_dir or default_output_dir(),
        overwrite=args.force,
        fit_to_canvas=not args.no_fit_canvas,
        canvas_padding=max(0, args.canvas_padding),
    )

    paths: list[Path] = []
    for raw in args.inputs:
        p = raw.resolve()
        if not p.is_file():
            print(f"Not found: {p}", file=sys.stderr)
            return 1
        if not is_supported(p):
            print(f"Unsupported: {p}", file=sys.stderr)
            return 1
        paths.append(p)

    try:
        results = convert_files(paths, options, progress=print)
    except Exception as exc:
        print(f"Failed: {exc}", file=sys.stderr)
        return 1

    for r in results:
        print(f"  {r.input_path.name} -> {r.output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
