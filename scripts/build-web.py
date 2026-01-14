#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ModuleNotFoundError as exc:  # pragma: no cover - build-time dependency.
    raise SystemExit(
        "Jinja2 is required. Install with: python3 -m pip install jinja2"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
PAGES = WEB / "pages"


def build_page(env: Environment, page_path: Path) -> None:
    template = env.get_template(f"pages/{page_path.name}")
    output_path = WEB / page_path.name
    output_path.write_text(template.render(), encoding="utf-8")
    print(f"Built {output_path.relative_to(ROOT)}")


def main() -> None:
    if not PAGES.exists():
        raise SystemExit("web/pages not found.")
    env = Environment(
        loader=FileSystemLoader(WEB),
        autoescape=select_autoescape(["html"]),
    )
    for page_path in sorted(PAGES.glob("*.html")):
        build_page(env, page_path)


if __name__ == "__main__":
    main()
