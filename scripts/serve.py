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
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class RootRequestHandler(http.server.SimpleHTTPRequestHandler):
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
