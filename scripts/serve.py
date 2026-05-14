#!/usr/bin/env python3
"""
Локальный статический сервер для разработки (корень репозитория).

Windows:  py scripts/serve.py
          python scripts/serve.py
Unix:     python3 scripts/serve.py
"""

from __future__ import annotations

import argparse
import http.server
import mimetypes
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# На Windows типичный `mimetypes.guess_type` даёт для `.js` `text/plain`, для
# части шрифтов — пустой тип; браузеры ждут корректный `Content-Type` (особенно
# для ES modules и SVG). Дублируем явные сопоставления в `extensions_map` и
# регистрируем их в глобальном реестре `mimetypes` на всякий случай.
_WEB_EXTENSION_TYPES: dict[str, str] = {
    ".avif": "image/avif",
    ".cjs": "text/javascript",
    ".css": "text/css",
    ".eot": "application/vnd.ms-fontobject",
    ".gif": "image/gif",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".htm": "text/html",
    ".html": "text/html",
    ".ico": "image/vnd.microsoft.icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".map": "application/json",
    ".mjs": "text/javascript",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".ogg": "audio/ogg",
    ".otf": "font/otf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ts": "text/typescript",
    ".ttf": "font/ttf",
    ".wasm": "application/wasm",
    ".wav": "audio/wav",
    ".webm": "video/webm",
    ".webp": "image/webp",
    ".webmanifest": "application/manifest+json",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".xml": "application/xml",
}


def _register_mimetypes() -> None:
    for ext, mime in _WEB_EXTENSION_TYPES.items():
        mimetypes.add_type(mime, ext, strict=False)


def _merged_extensions_map() -> dict[str, str]:
    base = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    base.update(_WEB_EXTENSION_TYPES)
    return base


_register_mimetypes()


class RootRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = _merged_extensions_map()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main() -> None:
    parser = argparse.ArgumentParser(description="HTTP-сервер для статики проекта.")
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=8080,
        help="Порт (по умолчанию 8080).",
    )
    parser.add_argument(
        "--bind",
        default="127.0.0.1",
        help="Адрес привязки (по умолчанию 127.0.0.1).",
    )
    args = parser.parse_args()

    with socketserver.ThreadingTCPServer(
        (args.bind, args.port), RootRequestHandler
    ) as httpd:
        url = f"http://{args.bind}:{args.port}/"
        print(f"Serving {ROOT}")
        print(f"Open: {url}")
        print("Stop: Ctrl+C")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()
