# Raster → SVG (монохром)

Локальная утилита для трассировки растровых подложек и UI-графики в SVG. Результат по умолчанию сохраняется в `assets/svg/ui/`.

## Быстрый старт (Windows)

1. Двойной клик по [`vectorize.bat`](vectorize.bat).
2. При первом запуске создаётся `.venv` и ставятся зависимости (`vtracer`, `Pillow`).
3. Добавьте PNG/WebP → выберите пресет → **▶ Обработать** (кнопка в блоке «Обработка», статус и прогресс показывают ход работы).

## CLI

Из корня репозитория (после `pip install -r scripts/vectorize/requirements.txt`):

```text
py scripts/vectorize/vectorize_cli.py assets/ui/menu_logo.png --preset logo
py scripts/vectorize/vectorize_cli.py docs/image-gen/ui-main-menu.png --preset background --force
```

Опции: `--preset`, `--max-side`, `--threshold`, `--auto-threshold`, `--invert`, `--blur`, `--output-dir`, `--force`, `--no-fit-canvas`.

По умолчанию включено **«Полотно по контуру»**: размер SVG = bbox вектора + отступ по краям (по умолчанию 10 px, настраивается). Без растягивания на размер исходного PNG.

## Пресеты

| ID | Назначение |
|----|------------|
| `background` | Крупные UI-подложки (max 1920 px, Otsu, больше filter_speckle) |
| `button` | Кнопки и рамки (порог 128, лёгкий blur) |
| `logo` | Логотипы и иконки (max 512 px, spline, мелкий speckle) |

## Workflow для Sky Rider

1. Положите растр в `assets/ui/` или возьмите референс из `docs/image-gen/`.
2. Прогоните через утилиту → SVG в `assets/svg/ui/`.
3. Откройте SVG в Inkscape: упростите пути, подгоните цвета под [`docs/visual-style.md`](../../docs/visual-style.md) и `src/config/palette.js`.
4. Обновите путь в коде (например `MainMenuScreen.js` для логотипа).

## Ограничения

- Автотрассировка даёт **черновик** из `path`, не градиенты как в ручных `menu_background.svg` / `menu_frame.svg`.
- Подложки 1920×1080 могут дать **большой** SVG — уменьшайте `max_side` или дорабатывайте вручную.
- Сложные градиенты и шум плохо переводятся в монохром; для финала часто проще нарисовать SVG по референсу.

## Зависимости

- Python 3.10+
- [vtracer](https://pypi.org/project/vtracer/) — бинарная трассировка
- Pillow — порог, resize, blur
