#!/usr/bin/env python3
"""GUI: raster → monochrome SVG."""

from __future__ import annotations

import os
import sys
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from PIL import Image, ImageTk

from core import (
    ConvertOptions,
    convert_files,
    default_output_dir,
    is_supported,
    repo_root,
)
from presets import PRESETS, PRESET_LABELS, preset_ids

class VectorizeApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Sky Rider — PNG → SVG")
        self.geometry("500x680")
        self.minsize(460, 620)

        self.queue: list[Path] = []
        self._photo: ImageTk.PhotoImage | None = None
        self._busy = False

        self.preset_var = tk.StringVar(value="logo")
        self.max_side_var = tk.IntVar(value=PRESETS["logo"].max_side)
        self.threshold_var = tk.IntVar(value=128)
        self.auto_threshold_var = tk.BooleanVar(value=True)
        self.invert_var = tk.BooleanVar(value=False)
        self.blur_var = tk.BooleanVar(value=False)
        self.overwrite_var = tk.BooleanVar(value=False)
        self.fit_canvas_var = tk.BooleanVar(value=True)
        self.canvas_pad_var = tk.IntVar(value=10)
        self.status_var = tk.StringVar(value="Готов к обработке")
        self.filter_speckle_var = tk.IntVar(value=PRESETS["logo"].filter_speckle)
        self.corner_var = tk.IntVar(value=PRESETS["logo"].corner_threshold)
        self.length_var = tk.DoubleVar(value=PRESETS["logo"].length_threshold)
        self.path_prec_var = tk.IntVar(value=PRESETS["logo"].path_precision)
        self.mode_var = tk.StringVar(value=PRESETS["logo"].mode)

        style = ttk.Style(self)
        style.configure("Process.TButton", font=("Segoe UI", 11, "bold"))

        self._build_ui()
        self._apply_preset_to_form("logo")
        self._set_idle_state()

    def _build_ui(self) -> None:
        pad = {"padx": 10, "pady": 4}

        frm_in = ttk.LabelFrame(self, text="Входные файлы")
        frm_in.pack(fill=tk.BOTH, expand=False, **pad)

        btn_row = ttk.Frame(frm_in)
        btn_row.pack(fill=tk.X, padx=6, pady=6)
        ttk.Button(btn_row, text="Добавить файлы…", command=self._add_files).pack(
            side=tk.LEFT, padx=(0, 6)
        )
        ttk.Button(btn_row, text="Очистить", command=self._clear_queue).pack(side=tk.LEFT)

        self.listbox = tk.Listbox(frm_in, height=5, selectmode=tk.EXTENDED)
        self.listbox.pack(fill=tk.BOTH, expand=True, padx=6, pady=(0, 6))
        self.listbox.bind("<<ListboxSelect>>", self._on_select_preview)

        frm_out = ttk.LabelFrame(self, text="Выход")
        frm_out.pack(fill=tk.X, **pad)

        out_path = default_output_dir().relative_to(repo_root())
        self.out_label = ttk.Label(frm_out, text=str(out_path))
        self.out_label.pack(anchor=tk.W, padx=8, pady=4)
        ttk.Button(frm_out, text="Открыть папку", command=self._open_output_dir).pack(
            anchor=tk.W, padx=8, pady=(0, 6)
        )

        frm_preset = ttk.LabelFrame(self, text="Пресет")
        frm_preset.pack(fill=tk.X, **pad)

        preset_row = ttk.Frame(frm_preset)
        preset_row.pack(fill=tk.X, padx=8, pady=6)
        for pid in preset_ids():
            ttk.Radiobutton(
                preset_row,
                text=PRESET_LABELS[pid],
                variable=self.preset_var,
                value=pid,
                command=self._on_preset_changed,
            ).pack(anchor=tk.W)

        frm_params = ttk.LabelFrame(self, text="Параметры")
        frm_params.pack(fill=tk.X, **pad)

        ttk.Label(frm_params, text="Max side (px):").grid(row=0, column=0, sticky=tk.W, padx=8, pady=2)
        ttk.Spinbox(
            frm_params,
            from_=64,
            to=4096,
            textvariable=self.max_side_var,
            width=8,
        ).grid(row=0, column=1, sticky=tk.W, pady=2)

        ttk.Checkbutton(
            frm_params,
            text="Порог авто (Otsu)",
            variable=self.auto_threshold_var,
            command=self._toggle_threshold,
        ).grid(row=1, column=0, columnspan=2, sticky=tk.W, padx=8, pady=2)

        ttk.Label(frm_params, text="Порог 0–255:").grid(row=2, column=0, sticky=tk.W, padx=8, pady=2)
        self.threshold_scale = ttk.Scale(
            frm_params,
            from_=0,
            to=255,
            variable=self.threshold_var,
            orient=tk.HORIZONTAL,
            length=200,
        )
        self.threshold_scale.grid(row=2, column=1, sticky=tk.W, pady=2)

        ttk.Checkbutton(frm_params, text="Инвертировать", variable=self.invert_var).grid(
            row=3, column=0, columnspan=2, sticky=tk.W, padx=8, pady=2
        )
        ttk.Checkbutton(frm_params, text="Blur 1px", variable=self.blur_var).grid(
            row=4, column=0, columnspan=2, sticky=tk.W, padx=8, pady=2
        )
        ttk.Checkbutton(frm_params, text="Перезаписывать SVG", variable=self.overwrite_var).grid(
            row=5, column=0, columnspan=2, sticky=tk.W, padx=8, pady=2
        )
        ttk.Checkbutton(
            frm_params,
            text="Полотно по контуру (+ отступ по краям)",
            variable=self.fit_canvas_var,
        ).grid(row=6, column=0, columnspan=2, sticky=tk.W, padx=8, pady=2)
        ttk.Label(frm_params, text="Отступ (px):").grid(row=7, column=0, sticky=tk.W, padx=8, pady=2)
        ttk.Spinbox(
            frm_params,
            from_=0,
            to=128,
            textvariable=self.canvas_pad_var,
            width=6,
        ).grid(row=7, column=1, sticky=tk.W, pady=2)

        self.advanced = ttk.LabelFrame(self, text="Трассировка (vtracer)")
        self.advanced.pack(fill=tk.X, **pad)

        ttk.Label(self.advanced, text="filter_speckle:").grid(row=0, column=0, sticky=tk.W, padx=8, pady=2)
        ttk.Spinbox(
            self.advanced, from_=0, to=32, textvariable=self.filter_speckle_var, width=6
        ).grid(row=0, column=1, sticky=tk.W, pady=2)

        ttk.Label(self.advanced, text="corner_threshold:").grid(
            row=1, column=0, sticky=tk.W, padx=8, pady=2
        )
        ttk.Spinbox(self.advanced, from_=0, to=180, textvariable=self.corner_var, width=6).grid(
            row=1, column=1, sticky=tk.W, pady=2
        )

        ttk.Label(self.advanced, text="length_threshold:").grid(
            row=2, column=0, sticky=tk.W, padx=8, pady=2
        )
        ttk.Spinbox(
            self.advanced,
            from_=3.5,
            to=10.0,
            increment=0.5,
            textvariable=self.length_var,
            width=6,
        ).grid(row=2, column=1, sticky=tk.W, pady=2)

        ttk.Label(self.advanced, text="path_precision:").grid(row=3, column=0, sticky=tk.W, padx=8, pady=2)
        ttk.Spinbox(self.advanced, from_=1, to=8, textvariable=self.path_prec_var, width=6).grid(
            row=3, column=1, sticky=tk.W, pady=2
        )

        ttk.Label(self.advanced, text="mode:").grid(row=4, column=0, sticky=tk.W, padx=8, pady=2)
        ttk.Combobox(
            self.advanced,
            textvariable=self.mode_var,
            values=["polygon", "spline", "none"],
            width=10,
            state="readonly",
        ).grid(row=4, column=1, sticky=tk.W, pady=2)

        frm_preview = ttk.LabelFrame(self, text="Превью")
        frm_preview.pack(fill=tk.X, **pad)

        self.preview_label = ttk.Label(frm_preview, text="(выберите файл в списке)")
        self.preview_label.pack(padx=8, pady=8)

        frm_action = ttk.LabelFrame(self, text="Обработка")
        frm_action.pack(fill=tk.X, padx=10, pady=6)

        self.process_btn = ttk.Button(
            frm_action,
            text="▶  Обработать",
            command=self._start_convert,
            style="Process.TButton",
        )
        self.process_btn.pack(fill=tk.X, padx=12, pady=(10, 6), ipady=8)

        self.status_label = ttk.Label(
            frm_action,
            textvariable=self.status_var,
            font=("Segoe UI", 10),
        )
        self.status_label.pack(anchor=tk.W, padx=12, pady=(0, 4))

        self.progress = ttk.Progressbar(frm_action, mode="indeterminate")
        self.progress.pack(fill=tk.X, padx=12, pady=(0, 10))

        frm_log = ttk.LabelFrame(self, text="Лог")
        frm_log.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))

        self.log = tk.Text(frm_log, height=6, state=tk.DISABLED, wrap=tk.WORD)
        scroll = ttk.Scrollbar(frm_log, command=self.log.yview)
        self.log.configure(yscrollcommand=scroll.set)
        self.log.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)

    def _log(self, msg: str) -> None:
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, msg + "\n")
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)

    def _add_files(self) -> None:
        paths = filedialog.askopenfilenames(
            title="Выберите изображения",
            initialdir=str(repo_root()),
            filetypes=[
                ("Images", "*.png *.jpg *.jpeg *.webp *.bmp *.gif *.tif *.tiff"),
                ("All", "*.*"),
            ],
        )
        for raw in paths:
            p = Path(raw)
            if not is_supported(p):
                self._log(f"Пропуск (формат): {p.name}")
                continue
            if p not in self.queue:
                self.queue.append(p)
                self.listbox.insert(tk.END, p.name)
        if self.queue:
            self.listbox.selection_clear(0, tk.END)
            self.listbox.selection_set(tk.END)
            self.listbox.see(tk.END)
            self._on_select_preview()

    def _clear_queue(self) -> None:
        self.queue.clear()
        self.listbox.delete(0, tk.END)
        self.preview_label.configure(image="", text="(выберите файл в списке)")
        self._photo = None

    def _open_output_dir(self) -> None:
        out = default_output_dir()
        out.mkdir(parents=True, exist_ok=True)
        os.startfile(out)  # type: ignore[attr-defined]

    def _on_preset_changed(self) -> None:
        self._apply_preset_to_form(self.preset_var.get())

    def _apply_preset_to_form(self, preset_id: str) -> None:
        p = PRESETS[preset_id]  # type: ignore[index]
        self.max_side_var.set(p.max_side)
        self.auto_threshold_var.set(p.threshold is None)
        if p.threshold is not None:
            self.threshold_var.set(p.threshold)
        self.invert_var.set(p.invert)
        self.blur_var.set(p.blur)
        self.filter_speckle_var.set(p.filter_speckle)
        self.corner_var.set(p.corner_threshold)
        self.length_var.set(p.length_threshold)
        self.path_prec_var.set(p.path_precision)
        self.mode_var.set(p.mode)
        self._toggle_threshold()

    def _toggle_threshold(self) -> None:
        state = tk.DISABLED if self.auto_threshold_var.get() else tk.NORMAL
        self.threshold_scale.configure(state=state)

    def _on_select_preview(self, _event=None) -> None:
        sel = self.listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        if idx >= len(self.queue):
            return
        path = self.queue[idx]
        try:
            with Image.open(path) as img:
                img.thumbnail((200, 120), Image.Resampling.LANCZOS)
                self._photo = ImageTk.PhotoImage(img)
            self.preview_label.configure(image=self._photo, text="")
        except Exception as exc:
            self.preview_label.configure(image="", text=f"Превью недоступно: {exc}")
            self._photo = None

    def _build_options(self) -> ConvertOptions:
        threshold = None if self.auto_threshold_var.get() else int(self.threshold_var.get())
        return ConvertOptions(
            preset_id=self.preset_var.get(),
            max_side=int(self.max_side_var.get()),
            threshold=threshold,
            invert=self.invert_var.get(),
            blur=self.blur_var.get(),
            filter_speckle=int(self.filter_speckle_var.get()),
            corner_threshold=int(self.corner_var.get()),
            length_threshold=float(self.length_var.get()),
            path_precision=int(self.path_prec_var.get()),
            mode=self.mode_var.get(),
            output_dir=default_output_dir(),
            overwrite=self.overwrite_var.get(),
            fit_to_canvas=self.fit_canvas_var.get(),
            canvas_padding=int(self.canvas_pad_var.get()),
        )

    def _set_idle_state(self) -> None:
        self.process_btn.configure(state=tk.NORMAL, text="▶  Обработать")
        self.status_var.set("Готов к обработке")
        self.status_label.configure(foreground="")

    def _set_busy_state(self, file_count: int) -> None:
        self.process_btn.configure(state=tk.DISABLED, text="⏳  Обработка…")
        self.status_var.set(f"Идёт обработка ({file_count} файл.) — подождите")
        self.status_label.configure(foreground="#0066b3")

    def _start_convert(self) -> None:
        if self._busy:
            return
        if not self.queue:
            messagebox.showwarning("Нет файлов", "Добавьте хотя бы одно изображение.")
            return

        out = default_output_dir()
        conflicts = [
            out / f"{p.stem}.svg"
            for p in self.queue
            if (out / f"{p.stem}.svg").exists() and not self.overwrite_var.get()
        ]
        if conflicts:
            names = ", ".join(c.name for c in conflicts[:3])
            extra = f" (+{len(conflicts) - 3})" if len(conflicts) > 3 else ""
            if not messagebox.askyesno(
                "Файлы существуют",
                f"SVG уже есть: {names}{extra}.\n"
                "Продолжить с суффиксом _traced или отменить?\n"
                "(Включите «Перезаписывать» для замены.)",
            ):
                return

        self._busy = True
        self._log("——— Запуск обработки ———")
        self._set_busy_state(len(self.queue))
        self.progress.start(12)
        self.update_idletasks()
        options = self._build_options()
        paths = list(self.queue)

        def worker() -> None:
            try:
                def progress(msg: str) -> None:
                    self.after(0, lambda m=msg: self._log(m))
                    self.after(0, lambda m=msg: self.status_var.set(m))

                results = convert_files(paths, options, progress=progress)
                summary = "\n".join(
                    f"✓ {r.input_path.name} → {r.output_path.relative_to(repo_root())}"
                    for r in results
                )
                self.after(0, lambda: self._on_done(True, summary))
            except Exception as exc:
                self.after(0, lambda: self._on_done(False, str(exc)))

        threading.Thread(target=worker, daemon=True).start()

    def _on_done(self, ok: bool, message: str) -> None:
        self.progress.stop()
        self._busy = False
        self._log(message)
        if ok:
            self.status_var.set("Готово")
            self.status_label.configure(foreground="#1a7f37")
            self.process_btn.configure(text="✓  Готово")
            self.after(2500, self._set_idle_state)
            messagebox.showinfo("Готово", message)
        else:
            self.status_var.set("Ошибка обработки")
            self.status_label.configure(foreground="#b3261e")
            self._set_idle_state()
            messagebox.showerror("Ошибка", message)


def main() -> None:
    app = VectorizeApp()
    app.mainloop()


if __name__ == "__main__":
    main()
