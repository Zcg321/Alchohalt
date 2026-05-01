"""
Render docs/legal/*.md to a static HTML site under _legal_site/.

Output:
  _legal_site/index.html              (table of contents)
  _legal_site/privacy-policy.html
  _legal_site/terms-of-service.html
  _legal_site/eula.html
  _legal_site/subscription-terms.html
  _legal_site/consumer-health-data-policy.html

Used by .github/workflows/pages.yml to publish the legal pages at
https://<owner>.github.io/<repo>/.

Dependencies: pip install markdown
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

import markdown  # type: ignore[import-not-found]

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = REPO_ROOT / "docs" / "legal"
OUT_DIR = REPO_ROOT / "_legal_site"

DOCS = [
    ("PRIVACY_POLICY.md", "privacy-policy.html", "Privacy Policy"),
    ("TERMS_OF_SERVICE.md", "terms-of-service.html", "Terms of Service"),
    ("EULA.md", "eula.html", "End User License Agreement"),
    ("SUBSCRIPTION_TERMS.md", "subscription-terms.html", "Subscription Terms"),
    (
        "CONSUMER_HEALTH_DATA_POLICY.md",
        "consumer-health-data-policy.html",
        "Consumer Health Data Policy",
    ),
]

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>{title} — Alchohalt</title>
  <meta name="robots" content="index,follow" />
  <style>
    :root {{
      --sage: #5A8073;
      --cream: #F8F5F0;
      --indigo: #3D4F7A;
      --ink: #2A3239;
      --muted: #6B7480;
      --line: #E5E1D8;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      background: var(--cream);
      color: var(--ink);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }}
    .wrap {{ max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }}
    .nav {{ font-size: 14px; color: var(--muted); margin-bottom: 32px; }}
    .nav a {{ color: var(--sage); text-decoration: none; }}
    .nav a:hover {{ text-decoration: underline; }}
    h1 {{ font-size: 32px; line-height: 1.2; margin: 0 0 8px; color: var(--ink); font-weight: 600; }}
    h2 {{ font-size: 22px; margin: 40px 0 12px; color: var(--ink); font-weight: 600; }}
    h3 {{ font-size: 17px; margin: 28px 0 8px; color: var(--ink); font-weight: 600; }}
    p, li {{ font-size: 16px; }}
    a {{ color: var(--sage); }}
    a:hover {{ color: var(--indigo); }}
    code {{ background: rgba(90,128,115,0.08); padding: 1px 6px; border-radius: 4px; font-size: 14px; }}
    hr {{ border: 0; border-top: 1px solid var(--line); margin: 32px 0; }}
    blockquote {{ margin: 16px 0; padding: 12px 16px; border-left: 3px solid var(--sage); background: rgba(90,128,115,0.05); color: var(--ink); }}
    table {{ border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }}
    th, td {{ border: 1px solid var(--line); padding: 8px 12px; text-align: left; vertical-align: top; }}
    th {{ background: rgba(90,128,115,0.08); font-weight: 600; }}
    .footer {{ margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="nav"><a href="./">← Alchohalt legal index</a></div>
    {content}
    <div class="footer">
      Alchohalt — calm tracking, real crisis support. Source:
      <a href="https://github.com/Zcg321/alchohalt/blob/main/docs/legal/{src}">docs/legal/{src}</a>
    </div>
  </main>
</body>
</html>
"""

INDEX_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Alchohalt — Legal</title>
  <meta name="robots" content="index,follow" />
  <style>
    :root {{
      --sage: #5A8073;
      --cream: #F8F5F0;
      --ink: #2A3239;
      --muted: #6B7480;
      --line: #E5E1D8;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif;
      background: var(--cream);
      color: var(--ink);
      line-height: 1.6;
    }}
    .wrap {{ max-width: 640px; margin: 0 auto; padding: 64px 24px; }}
    h1 {{ font-size: 32px; margin: 0 0 8px; font-weight: 600; }}
    .lede {{ color: var(--muted); margin: 0 0 32px; }}
    ul.docs {{ list-style: none; padding: 0; margin: 0; }}
    ul.docs li {{ padding: 16px 0; border-bottom: 1px solid var(--line); }}
    ul.docs a {{ color: var(--sage); text-decoration: none; font-size: 18px; font-weight: 500; }}
    ul.docs a:hover {{ color: var(--ink); }}
    ul.docs .desc {{ display: block; color: var(--muted); font-size: 14px; margin-top: 4px; }}
    .footer {{ margin-top: 48px; font-size: 13px; color: var(--muted); }}
  </style>
</head>
<body>
  <main class="wrap">
    <h1>Alchohalt — Legal</h1>
    <p class="lede">Public-hosted versions of the legal documents the App Store and Play Store reference at submission.</p>
    <ul class="docs">
      {entries}
    </ul>
    <div class="footer">
      Source: <a href="https://github.com/Zcg321/alchohalt/tree/main/docs/legal">github.com/Zcg321/alchohalt/docs/legal</a>
    </div>
  </main>
</body>
</html>
"""

DESCRIPTIONS = {
    "privacy-policy.html": "Data flow, third parties, GDPR/CCPA rights, retention.",
    "terms-of-service.html": "User-publisher agreement and not-medical-advice disclaimer.",
    "eula.html": "Software license, Apple-required Section 7, AI Insights authorization.",
    "subscription-terms.html": "Auto-renewal disclosure, refund policy, free-vs-premium matrix.",
    "consumer-health-data-policy.html": "WA MHMDA / NV SB 370 / CO CPA / CT CTDPA compliance disclosures.",
}


def render_doc(src: Path, title: str) -> str:
    md_text = src.read_text(encoding="utf-8")
    # Strip the leading H1 if present — the template contributes the chrome,
    # but we keep the document's own H1 inline since it carries the
    # canonical product name.
    html = markdown.markdown(
        md_text,
        extensions=["extra", "sane_lists", "tables", "toc"],
    )
    return PAGE_TEMPLATE.format(title=title, content=html, src=src.name)


def render_index() -> str:
    items = []
    for _src, slug, title in DOCS:
        desc = DESCRIPTIONS.get(slug, "")
        items.append(
            f'<li><a href="{slug}">{title}</a>'
            f'<span class="desc">{desc}</span></li>'
        )
    return INDEX_TEMPLATE.format(entries="\n      ".join(items))


def main() -> None:
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for src_name, slug, title in DOCS:
        src = SRC_DIR / src_name
        if not src.exists():
            raise FileNotFoundError(f"Missing source: {src}")
        out = OUT_DIR / slug
        out.write_text(render_doc(src, title), encoding="utf-8")
        print(f"  rendered {src.name} ->{slug}")

    (OUT_DIR / "index.html").write_text(render_index(), encoding="utf-8")
    print(f"  rendered index.html")
    # Suppress underscore-prefixed-folder Jekyll behavior on GitHub Pages
    (OUT_DIR / ".nojekyll").write_text("", encoding="utf-8")
    print(f"\nWrote {OUT_DIR.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    # Minimal sanity check that we're not silently shipping placeholders
    for src_name, _slug, _title in DOCS:
        text = (SRC_DIR / src_name).read_text(encoding="utf-8")
        if not re.search(r"#\s+", text):
            raise SystemExit(f"{src_name} has no heading — refusing to publish")
    main()
