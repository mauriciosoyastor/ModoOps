"""Genera los PDF del contrato ModoOps v2 desde sus fuentes SSOT.

SSOT:
- docs/contrato-modoops-completo.html -> docs/contrato-modoops.pdf (formal + Anexo A + actas)
- docs/contrato-modoops-pedagogico.md -> docs/contrato-modoops-pedagogico.pdf (espejo didáctico)

Uso:  python docs/generar_pdf_contrato.py [--check]
--check: solo verifica que las fuentes existen (para CI, fail-closed).

Requiere: reportlab + Arial en C:\\Windows\\Fonts (fallback Helvetica).
Los glifos fuera de la fuente (☐ ⚠) se sanitizan para no salir cajas negras.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORMAL_HTML = ROOT / "docs" / "contrato-modoops-completo.html"
FORMAL_PDF = ROOT / "docs" / "contrato-modoops.pdf"
PEDAGOGICO_MD = ROOT / "docs" / "contrato-modoops-pedagogico.md"
PEDAGOGICO_PDF = ROOT / "docs" / "contrato-modoops-pedagogico.pdf"

SANITIZE = {"☐": "[ ]", "☑": "[x]", "⚠": "[!]", "→": "->"}


def clean(text: str) -> str:
    for old, new in SANITIZE.items():
        text = text.replace(old, new)
    return text


def _fonts():
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
        pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
        return "Arial", "Arial-Bold"
    except Exception:
        return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = _fonts()


def styles():
    from reportlab.lib.styles import ParagraphStyle

    return {
        "h1": ParagraphStyle("h1", fontName=FONT_BOLD, fontSize=15, alignment=1, spaceAfter=6),
        "h2": ParagraphStyle("h2", fontName=FONT_BOLD, fontSize=12, spaceBefore=14,
                             spaceAfter=4, borderPadding=(0, 0, 3, 0)),
        "h3": ParagraphStyle("h3", fontName=FONT_BOLD, fontSize=11, spaceBefore=10, spaceAfter=3),
        "body": ParagraphStyle("body", fontName=FONT, fontSize=10.5, leading=15, spaceAfter=4),
        "bullet": ParagraphStyle("bullet", parent=None, fontName=FONT, fontSize=10.5, leading=15,
                                 leftIndent=18, bulletIndent=6, spaceAfter=2),
        "sub": ParagraphStyle("sub", fontName=FONT, fontSize=9.5, alignment=1, textColor="#444444",
                              spaceAfter=10),
        "small": ParagraphStyle("small", fontName=FONT, fontSize=9, textColor="#333333", spaceAfter=4),
        "quote": ParagraphStyle("quote", fontName=FONT, fontSize=10.5, leading=15, leftIndent=14,
                                textColor="#333333", spaceAfter=4),
        "cell": ParagraphStyle("cell", fontName=FONT, fontSize=10, leading=13),
    }


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class ContractHTMLParser(HTMLParser):
    """Convierte el HTML del contrato formal a flowables platypus (subconjunto)."""

    def __init__(self, st):
        super().__init__(convert_charrefs=True)
        self.st = st
        self.flowables = []
        self._buf = ""
        self._mode = "body"  # h1|h2|h3|body|bullet|sub|small
        self._stack = []
        self._table = None
        self._row = None
        self._box = None  # None | "box" | "warn"
        self._box_paras = None
        self._skip = 0  # dentro de <head>/<style>/<script>: no sale al PDF
        self._cells = None  # celdas de firma en curso

    # -- helpers ---------------------------------------------------------
    def _flush(self):
        from reportlab.platypus import Paragraph

        text = clean(self._buf.strip())
        self._buf = ""
        if not text:
            return
        style = self.st["bullet"] if self._mode == "bullet" else self.st.get(self._mode, self.st["body"])
        prefix = "• " if self._mode == "bullet" else ""
        para = Paragraph(prefix + esc(text), style)
        if self._box_paras is not None:
            self._box_paras.append(para)
        else:
            self.flowables.append(para)

    def _boxed(self, kind):
        from reportlab.lib import colors
        from reportlab.platypus import Spacer, Table, TableStyle

        bg = colors.HexColor("#FFFBDB" if kind == "warn" else "#F4F4F4")
        table = Table([[p] for p in self._box_paras], colWidths=[440])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg),
            ("BOX", (0, 0), (-1, -1), 1, colors.black),
            ("INNERPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        self.flowables.append(table)
        self.flowables.append(Spacer(1, 6))
        self._box_paras = None

    # -- parser ----------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        cls = attrs.get("class", "")
        if tag in ("head", "style", "script"):
            self._skip += 1
            return
        if self._skip:
            return
        if tag == "div" and cls == "firma":
            self._flush()
            self._stack.append("firma-entry")
            self._cells = []
            return
        if tag == "div" and "firma-entry" in self._stack:
            self._flush()
            self._stack.append("firma-cell")
            self._buf = ""
            return
        if tag in ("h1", "h2", "h3", "p"):
            self._flush()
            if tag == "p" and cls == "sub":
                self._mode = "sub"
            elif tag == "p" and cls == "small":
                self._mode = "small"
            else:
                self._mode = tag if tag in ("h1", "h2", "h3") else "body"
        elif tag == "li":
            self._flush()
            self._mode = "bullet"
        elif tag in ("ul", "ol"):
            self._flush()
        elif tag == "br":
            self._buf += "\n"
        elif tag == "table":
            self._flush()
            self._table = []
        elif tag == "tr":
            self._row = []
        elif tag == "td":
            self._buf = ""
            self._stack.append("td")
        elif tag == "div" and cls in ("box", "warn"):
            self._flush()
            self._box = cls
            self._box_paras = []
        elif tag == "div" and cls == "pagebreak":
            self._flush()
            from reportlab.platypus import PageBreak
            self.flowables.append(PageBreak())

    def handle_endtag(self, tag):
        if tag in ("head", "style", "script"):
            self._skip = max(0, self._skip - 1)
            return
        if self._skip:
            return
        if tag == "div" and self._stack and self._stack[-1] == "firma-cell":
            from reportlab.platypus import Paragraph

            self._stack.pop()
            cell = clean(self._buf.strip()).replace("\n", "<br/>")
            self._cells.append(Paragraph(esc(cell).replace("&lt;br/&gt;", "<br/>"), self.st["cell"]))
            self._buf = ""
            return
        if tag == "div" and self._stack and self._stack[-1] == "firma-entry":
            from reportlab.lib import colors
            from reportlab.platypus import Spacer, Table, TableStyle

            self._stack.pop()
            cells = self._cells or []
            while len(cells) < 2:
                from reportlab.platypus import Paragraph
                cells.append(Paragraph("", self.st["cell"]))
            firma = Table([cells[:2]], colWidths=[230, 230])
            firma.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
            self.flowables.append(firma)
            self.flowables.append(Spacer(1, 6))
            self._cells = None
            return
        if tag in ("h1", "h2", "h3", "p", "li"):
            self._flush()
            self._mode = "body"
        elif tag == "td" and self._stack and self._stack[-1] == "td":
            self._stack.pop()
            self._row.append(clean(self._buf.strip()))
            self._buf = ""
        elif tag == "tr" and self._row is not None:
            self._table.append(self._row)
            self._row = None
        elif tag == "table" and self._table is not None:
            from reportlab.lib import colors
            from reportlab.platypus import Spacer, Table, TableStyle

            rows = [[__import__("reportlab.platypus", fromlist=["Paragraph"]).Paragraph(
                esc(c), self.st["cell"]) for c in r] for r in self._table]
            table = Table(rows, colWidths=[30, 430])
            table.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.7, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("INNERPADDING", (0, 0), (-1, -1), 5),
            ]))
            self.flowables.append(table)
            self.flowables.append(Spacer(1, 6))
            self._table = None
        elif tag == "div" and self._box_paras is not None:
            self._flush()
            self._boxed(self._box)
            self._box = None

    def handle_data(self, data):
        if self._skip:
            return
        if "firma-entry" in self._stack and "firma-cell" not in self._stack:
            return  # espacios entre celdas de firma: no salen al PDF
        if self._mode in ("h1", "h2", "h3", "body", "bullet", "sub", "small"):
            self._buf += data


def md_inline(text: str) -> str:
    text = esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    return text


def parse_markdown(path: Path, st) -> list:
    from reportlab.platypus import HRFlowable, Paragraph, Spacer

    flows = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = clean(raw.rstrip())
        if not line.strip():
            continue
        if line.startswith("# "):
            flows.append(Paragraph(esc(line[2:].strip()), st["h1"]))
        elif line.startswith("## "):
            flows.append(Paragraph(esc(line[3:].strip()), st["h2"]))
        elif line.startswith("### "):
            flows.append(Paragraph(esc(line[4:].strip()), st["h3"]))
        elif line.strip() == "---":
            flows.append(Spacer(1, 4))
            flows.append(HRFlowable(width="100%", thickness=0.7, spaceAfter=4))
        elif line.lstrip().startswith(("- ", "* ")):
            flows.append(Paragraph("• " + md_inline(line.lstrip()[2:].strip()), st["bullet"]))
        elif re.match(r"^\d+\.\s", line.lstrip()):
            flows.append(Paragraph("• " + md_inline(re.sub(r"^\d+\.\s", "", line.lstrip())), st["bullet"]))
        elif line.lstrip().startswith("> "):
            flows.append(Paragraph(md_inline(line.lstrip()[2:].strip()), st["quote"]))
        elif line.startswith("|"):
            flows.append(Paragraph(md_inline(line.strip()), st["small"]))
        else:
            flows.append(Paragraph(md_inline(line.strip()), st["body"]))
    return flows


def build(source_flows: list, out: Path):
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate

    doc = SimpleDocTemplate(str(out), pagesize=A4,
                            leftMargin=50, rightMargin=50, topMargin=55, bottomMargin=55,
                            title=out.stem)
    doc.build(source_flows)
    print(f"PDF guardado en: {out}")


def main() -> int:
    for src in (FORMAL_HTML, PEDAGOGICO_MD):
        if not src.exists():
            print(f"Falta fuente SSOT: {src}")
            return 1
    if "--check" in sys.argv:
        print("Fuentes contrato v2 OK.")
        return 0
    st = styles()
    parser = ContractHTMLParser(st)
    parser.feed(FORMAL_HTML.read_text(encoding="utf-8"))
    build(parser.flowables, FORMAL_PDF)
    build(parse_markdown(PEDAGOGICO_MD, st), PEDAGOGICO_PDF)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
