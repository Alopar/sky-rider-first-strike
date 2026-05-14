# sky-rider-first-strike

A game about an airplane and its pilot.

## Локальный запуск

Нужен **Python 3**. Из корня репозитория:

```bash
python scripts/serve.py
```

На Windows при необходимости: `py scripts/serve.py`.

По умолчанию сервер слушает `http://127.0.0.1:8080/`. Другой порт: `python scripts/serve.py -p 5500`. Другой адрес привязки: `python scripts/serve.py --bind 0.0.0.0`.

Откройте в браузере напечатанный URL. Не открывайте `index.html` через `file://` — так нарушаются правила загрузки скриптов и путей к ассетам.

## Стек

- HTML + [Phaser 4](https://phaser.io/) (CDN, версия зафиксирована в `index.html`; см. [документацию](https://docs.phaser.io/)).
- Исходники: `src/`, ассеты: `assets/`.
