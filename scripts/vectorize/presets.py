"""Named parameter presets for raster → SVG tracing."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PresetId = Literal["background", "button", "logo"]

PRESET_LABELS: dict[PresetId, str] = {
    "background": "UI подложка",
    "button": "Кнопка / рамка",
    "logo": "Логотип / иконка",
}


@dataclass(frozen=True)
class TracePreset:
    id: PresetId
    label: str
    max_side: int
    threshold: int | None  # None = Otsu auto
    invert: bool
    blur: bool
    filter_speckle: int
    corner_threshold: int
    length_threshold: float
    path_precision: int
    mode: str  # polygon | spline
    splice_threshold: int
    max_iterations: int


PRESETS: dict[PresetId, TracePreset] = {
    "background": TracePreset(
        id="background",
        label=PRESET_LABELS["background"],
        max_side=1920,
        threshold=None,
        invert=False,
        blur=False,
        filter_speckle=6,
        corner_threshold=60,
        length_threshold=4.0,
        path_precision=3,
        mode="polygon",
        splice_threshold=45,
        max_iterations=10,
    ),
    "button": TracePreset(
        id="button",
        label=PRESET_LABELS["button"],
        max_side=1024,
        threshold=128,
        invert=False,
        blur=True,
        filter_speckle=4,
        corner_threshold=55,
        length_threshold=4.0,
        path_precision=3,
        mode="polygon",
        splice_threshold=45,
        max_iterations=10,
    ),
    "logo": TracePreset(
        id="logo",
        label=PRESET_LABELS["logo"],
        max_side=512,
        threshold=None,
        invert=False,
        blur=False,
        filter_speckle=2,
        corner_threshold=50,
        length_threshold=3.5,
        path_precision=4,
        mode="spline",
        splice_threshold=45,
        max_iterations=10,
    ),
}


def preset_ids() -> list[PresetId]:
    return list(PRESETS.keys())


def get_preset(preset_id: str) -> TracePreset:
    if preset_id not in PRESETS:
        valid = ", ".join(PRESETS)
        raise ValueError(f"Unknown preset {preset_id!r}. Valid: {valid}")
    return PRESETS[preset_id]  # type: ignore[index]
