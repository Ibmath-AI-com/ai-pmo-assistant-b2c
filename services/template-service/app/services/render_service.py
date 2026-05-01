from __future__ import annotations

from jinja2 import Environment, StrictUndefined, Undefined


class SilentUndefined(Undefined):
    def _fail_with_undefined_error(self, *args, **kwargs):
        return ""

    __str__ = lambda self: ""  # noqa: E731
    __iter__ = lambda self: iter([])  # noqa: E731
    __len__ = lambda self: 0  # noqa: E731


_env = Environment(undefined=SilentUndefined, autoescape=False)


def render(template_body: str, input_data: dict) -> str:
    tmpl = _env.from_string(template_body)
    return tmpl.render(**input_data)


def render_to_html(template_body: str, input_data: dict) -> str:
    rendered = render(template_body, input_data)
    # Wrap plain text/markdown in minimal HTML for WeasyPrint
    if not rendered.strip().startswith("<"):
        lines = rendered.split("\n")
        html_lines = []
        for line in lines:
            if line.startswith("# "):
                html_lines.append(f"<h1>{line[2:].strip()}</h1>")
            elif line.startswith("## "):
                html_lines.append(f"<h2>{line[3:].strip()}</h2>")
            elif line.startswith("### "):
                html_lines.append(f"<h3>{line[4:].strip()}</h3>")
            elif line.startswith("- "):
                html_lines.append(f"<li>{line[2:].strip()}</li>")
            elif line.startswith("**") and line.endswith("**"):
                html_lines.append(f"<strong>{line[2:-2]}</strong>")
            elif line.strip():
                html_lines.append(f"<p>{line.strip()}</p>")
        rendered = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
  h1 {{ color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 8px; }}
  h2 {{ color: #34495e; margin-top: 24px; }}
  h3 {{ color: #555; }}
  li {{ margin: 4px 0; }}
  p {{ margin: 8px 0; }}
</style>
</head><body>{"".join(html_lines)}</body></html>"""
    return rendered
