#!/usr/bin/env python3
"""Genera PDF con estrategia de ventas para casa de repuestos de gas."""

from pathlib import Path

from fpdf import FPDF

OUTPUT = Path(r"C:\Users\mauri\OneDrive\Desktop\Estrategia-Venta-Odoo-Repuestos-Gas.pdf")


FONT = "Arial"


class SalesPDF(FPDF):
    def __init__(self):
        super().__init__()
        fonts = Path(r"C:\Windows\Fonts")
        self.add_font(FONT, "", str(fonts / "arial.ttf"))
        self.add_font(FONT, "B", str(fonts / "arialbd.ttf"))
        self.add_font(FONT, "I", str(fonts / "ariali.ttf"))
        self.add_font(FONT, "BI", str(fonts / "arialbi.ttf"))

    def footer(self):
        self.set_y(-15)
        self.set_font(FONT, "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"GalaxyGroup — Consultoría Odoo  |  Página {self.page_no()}", align="C")


def section_title(pdf: SalesPDF, text: str) -> None:
    pdf.ln(4)
    pdf.set_font(FONT, "B", 13)
    pdf.set_text_color(30, 60, 120)
    pdf.multi_cell(0, 8, text)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)


def subsection(pdf: SalesPDF, text: str) -> None:
    pdf.set_font(FONT, "B", 11)
    pdf.multi_cell(0, 7, text)
    pdf.ln(1)


def body(pdf: SalesPDF, text: str) -> None:
    pdf.set_font(FONT, "", 10)
    pdf.multi_cell(0, 5.5, text)
    pdf.ln(2)


def bullet(pdf: SalesPDF, text: str) -> None:
    pdf.set_font(FONT, "", 10)
    pdf.multi_cell(0, 5.5, f"  •  {text}")
    pdf.ln(1)


def centered(pdf: SalesPDF, text: str, size: int = 11, style: str = "", h: float = 7) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font(FONT, style, size)
    pdf.multi_cell(pdf.epw, h, text, align="C")


def quote_block(pdf: SalesPDF, text: str) -> None:
    pdf.set_fill_color(245, 247, 250)
    pdf.set_font(FONT, "I", 10)
    pdf.set_x(pdf.l_margin + 4)
    pdf.multi_cell(pdf.epw - 8, 5.5, text, fill=True)
    pdf.set_x(pdf.l_margin)
    pdf.ln(3)


def table_row(pdf: SalesPDF, col1: str, col2: str, header: bool = False) -> None:
    if header:
        pdf.set_font(FONT, "B", 9)
        pdf.set_fill_color(230, 235, 245)
    else:
        pdf.set_font(FONT, "", 9)
        pdf.set_fill_color(255, 255, 255)

    w1, w2 = 88, pdf.epw - 88
    h = 6
    x0, y0 = pdf.get_x(), pdf.get_y()

    pdf.multi_cell(w1, h, col1, border=1, fill=True, new_x="RIGHT", new_y="TOP", max_line_height=h)
    pdf.set_xy(x0 + w1, y0)
    pdf.multi_cell(w2, h, col2, border=1, fill=True, new_x="LMARGIN", new_y="NEXT", max_line_height=h)


def build_pdf() -> None:
    pdf = SalesPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # Portada
    pdf.set_font(FONT, "B", 22)
    pdf.set_text_color(30, 60, 120)
    centered(pdf, "Estrategia de ventas", size=22, style="B", h=12)
    pdf.ln(2)
    centered(
        pdf,
        "Odoo para casas de repuestos\nde artefactos para equipos de gas",
        size=14,
        h=8,
    )
    pdf.ln(6)
    pdf.set_text_color(80, 80, 80)
    centered(
        pdf,
        "GalaxyGroup — Consultoría de sistemas de gestión para comercios",
        size=11,
        h=6,
    )
    centered(pdf, "Mauricio Matasini", size=11, h=6)
    pdf.ln(4)
    pdf.set_text_color(0, 0, 0)
    pdf.set_font(FONT, "I", 10)
    pdf.multi_cell(
        0,
        5.5,
        "Guía para la primera reunión comercial. Alineada con el modelo comercial "
        "del paquete ancla retail (POS + inventario + compras + fiscal operativo).",
    )

    pdf.add_page()

    # 1
    section_title(pdf, "1. Por qué encajan (y por qué vos también)")
    body(
        pdf,
        "Una casa de repuestos de gas suele ser exactamente el perfil ideal (ICP): "
        "mostrador + depósito, catálogo grande pero con lógica repetible (marca, modelo, "
        "medida, tipo de pieza), y el dolor clásico de vender algo que no tienen, comprar "
        "de más o no saber qué falta.",
    )
    body(
        pdf,
        "Odoo les resuelve el núcleo: POS → descuenta stock → compras basadas en lo que "
        "se mueve → facturación operativa.",
    )

    # 2
    section_title(pdf, "2. Antes de la reunión (15 minutos de prep)")
    table_row(pdf, "Pregunta", "Para qué sirve", header=True)
    rows = [
        ("¿Cuántas cajas / mostradores tienen?", "El ancla cubre hasta 2 POS"),
        ("¿Cuántas personas usan el sistema hoy?", "~5 usuarios es el sweet spot"),
        ("¿Qué usan ahora?", "Detectás el dolor real (Excel, Tango, nada…)"),
        ("¿Cuántos productos aprox.?", "Hasta 500 con add-on de migración"),
        ("¿Solo mostrador o también técnicos con cuenta?", "B2B básico = add-on post go-live"),
        ("¿Cómo cargan precios y reposición?", "Argumento de una sola fuente de verdad"),
        ("¿Quién hace la facturación / AFIP?", "Anexo fiscal con el contador"),
    ]
    for c1, c2 in rows:
        table_row(pdf, c1, c2)
    pdf.ln(3)
    body(pdf, "No llegues a demo técnica profunda. Llegá a escuchar.")

    # 3
    section_title(pdf, "3. Speech de apertura (2–3 minutos)")
    quote_block(
        pdf,
        '"Gracias por el tiempo. Antes de hablar de sistemas, me gustaría entender '
        "cómo trabajan ustedes hoy.\n\n"
        "Lo que hacemos es ayudar a comercios con mostrador — ferreterías, repuestos, "
        "distribución chica — a tener caja, stock y compras en un solo lugar, sin planillas "
        "paralelas ni 'cargar dos veces lo mismo'.\n\n"
        "Implementamos Odoo, adaptado a Argentina: punto de venta en mostrador, inventario, "
        "compras a proveedores y contabilidad operativa alineada a ventas y compras. "
        "El cierre mensual lo sigue haciendo su estudio contable.\n\n"
        "No vendemos 'un ERP gigante': trabajamos con alcance cerrado, pensado para una "
        "sucursal y un equipo chico. Primero hacemos un descubrimiento de 3 días donde "
        "mapeamos su operación real y les entregamos un informe + propuesta con precio fijo.\n\n"
        '¿Les parece si empezamos por contarme cómo es un día normal acá? Desde que llega '
        'mercadería hasta que un cliente pide un repuesto en mostrador."',
    )
    body(pdf, "Clave: terminá con una pregunta, no con 'Odoo tiene 50 módulos'.")

    # 4
    section_title(pdf, "4. Preguntas que te hacen sonar consultor")
    subsection(pdf, "Operación diaria")
    bullet(pdf, "Cuando un cliente pide 'válvula para tal modelo', ¿cómo buscan si tienen stock?")
    bullet(pdf, "¿Qué pasa cuando venden algo y en el depósito no está?")
    bullet(pdf, "¿Quién decide qué reponer y con qué criterio?")

    subsection(pdf, "Catálogo")
    bullet(pdf, "¿Los productos se diferencian por marca, modelo, medida…?")
    bullet(pdf, "¿Tienen muchos códigos parecidos o códigos de proveedor distintos al suyo?")

    subsection(pdf, "Compras")
    bullet(pdf, "¿Las órdenes de compra las hacen a ojo, por mínimos, o mirando ventas?")
    bullet(pdf, "¿Reciben mercadería parcial o siempre completa?")

    subsection(pdf, "Clientes y fiscal")
    bullet(pdf, "¿Hay técnicos o empresas que compran seguido con cuenta corriente? (B2B = Fase 2)")
    bullet(pdf, "¿Facturan todo en mostrador? ¿Qué comprobantes usan hoy?")

    body(
        pdf,
        "Cada respuesta te da un gancho: 'Eso en Odoo queda en un flujo: venta → baja stock "
        "→ reporte de reposición → orden de compra.'",
    )

    pdf.add_page()

    # 5
    section_title(pdf, "5. Argumentos traducidos a su rubro")
    table_row(pdf, "Su dolor probable", "Tu mensaje", header=True)
    pain_rows = [
        ("No sé si tengo el repuesto sin ir al depósito", "POS integrado con stock en tiempo real"),
        ("Compramos de más y sobra", "Inventario + historial de movimientos"),
        ("El precio en caja no coincide con la planilla", "Una lista de precios centralizada"),
        ("Perdemos tiempo buscando códigos", "Catálogo con variantes (ej. marca + medida)"),
        ("No sabemos qué repuestos rotan", "Reportes de ventas por producto/categoría"),
        ("Queremos facturar bien con AFIP", "Localización Argentina + anexo fiscal con su contador"),
    ]
    for c1, c2 in pain_rows:
        table_row(pdf, c1, c2)
    pdf.ln(4)

    subsection(pdf, "Ejemplo concreto para repuestos de gas")
    quote_block(
        pdf,
        '"Imaginen que venden una termocupla en mostrador: la cajera la cobra en el POS, '
        "el sistema descuenta una unidad del depósito, y ustedes ven cuántas quedan. "
        "Si bajan de un mínimo, pueden generar una orden de compra al proveedor sin "
        'reescribir nada en Excel. Eso es lo que unificamos."',
    )

    # 6
    section_title(pdf, "6. Qué mostrar (si hay pantalla) — 5 minutos máximo")
    bullet(pdf, "Producto con variantes (marca/modelo o tipo/medida)")
    bullet(pdf, "POS: venta rápida → stock baja")
    bullet(pdf, "Inventario: cantidad actual")
    bullet(pdf, "Compras: orden → recepción")
    bullet(pdf, "Opcional: factura de prueba en homologación")
    body(
        pdf,
        "Decí siempre: 'Esto es el paquete base; lo afinamos en descubrimiento según su catálogo y fiscal.'",
    )

    # 7
    section_title(pdf, "7. Objeciones típicas y respuestas")
    objections = [
        (
            "Odoo es muy grande / complicado",
            "Por eso no vendemos 'todo Odoo'. Entregamos un paquete acotado: caja, stock, "
            "compras y lo fiscal operativo. Lo demás, si hace falta, es por fases.",
        ),
        (
            "Ya tenemos un sistema",
            "En descubrimiento vemos si conviene migrar catálogo o arrancar de cero. "
            "No prometo milagros sin ver sus datos.",
        ),
        (
            "¿Cuánto sale?",
            "El descubrimiento son $155.000 (3 días) y ahí cerramos alcance y precio de "
            "implementación. No cotizo a ojo porque cada catálogo y fiscal es distinto.",
        ),
        (
            "¿Y si no cerramos el proyecto?",
            "El descubrimiento igual les deja un informe útil: mapa de procesos, riesgos y "
            "recomendación. Si el alcance no encaja, se lo digo el día 1.",
        ),
        (
            "Necesitamos cuenta corriente para gasistas",
            "Se puede, pero es después del go-live, como ampliación B2B básica. "
            "Primero ordenamos mostrador + stock.",
        ),
        (
            "¿Vos sos programador o consultor?",
            "Consultor de implementación: parametrizo Odoo, coordino fiscal con su contador "
            "y los acompaño hasta el go-live. Desarrollo a medida solo si se cotiza aparte.",
        ),
    ]
    for q, a in objections:
        subsection(pdf, f'"{q}"')
        body(pdf, f"> {a}")

    pdf.add_page()

    # 8
    section_title(pdf, "8. Cierre de la reunión")
    body(
        pdf,
        "Objetivo realista: no firmar implementación mañana. Objetivo: acordar descubrimiento "
        "o segunda reunión con dueño + contador/encargado de depósito.",
    )
    quote_block(
        pdf,
        '"Con lo que me contaron, encajan en el perfil que trabajamos: mostrador, stock y '
        "compras en una sucursal. El próximo paso que recomiendo es el descubrimiento de 3 días: "
        "reunimos con quien opera caja, depósito y compras; hablamos con su contador sobre "
        "comprobantes; y les entrego informe + propuesta con precio fijo.\n\n"
        '¿Les sirve que les mande una propuesta de fechas para arrancar descubrimiento '
        'la semana que viene?"',
    )

    # 9
    section_title(pdf, "9. Señales de que SÍ / NO encajan")
    subsection(pdf, "Buenas señales")
    for item in [
        "Una sucursal, 1–2 cajas",
        "Dolor claro con stock/planillas",
        "Dueño o encargado con poder de decisión presente",
        "Dispuestos a dedicar tiempo a datos y fiscal",
    ]:
        bullet(pdf, item)

    subsection(pdf, "Alertas (decilo con honestidad)")
    for item in [
        "Multi-sucursal desde día 1",
        "Quieren e-commerce + ML + integración balanza + B2B complejo 'todo junto'",
        "Catálogo enorme con 5+ atributos por producto sin migración",
        "No tienen contador alineado para AFIP",
    ]:
        bullet(pdf, item)

    # 10
    section_title(pdf, "10. Checklist del día anterior")
    for item in [
        "Tarjetas / contacto: WhatsApp + email",
        "One-pager o landing impresa o en el celular",
        "3 preguntas personalizadas para repuestos de gas",
        "Demo corta preparada (flujo POS → stock → compra)",
        "Precio público claro: descubrimiento $155.000",
        "No prometer: CRM, e-commerce, multi-sucursal, integraciones 'de paso'",
    ]:
        bullet(pdf, item)

    # 11
    section_title(pdf, "11. Mentalidad para la primera venta")
    for item in [
        "Escuchá más de lo que hablás (70/30).",
        "No compitas con Tango/Facturador en features; competí en operación integrada.",
        "Tu producto estrella mañana es el descubrimiento, no el paquete de implementación.",
        "Si dudan, ofrecé: 'Traigan a la segunda reunión a quien más sufre con el stock.'",
    ]:
        bullet(pdf, item)

    pdf.ln(6)
    pdf.set_font(FONT, "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        0,
        5,
        "Contacto: consultoria.matasini@gmail.com  |  WhatsApp +54 9 354 753-2008\n"
        "Documento generado desde el modelo comercial GalaxyGroup / consultoria/CONTEXT.md",
        align="C",
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUTPUT))
    print(f"PDF guardado en: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
