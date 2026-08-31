try:
    from . import models
except ImportError:
    # Permite `pytest` host sin Odoo para tests de lógica pura (`modoops_ia/logic/*`)
    # Odoo sí lo importará en runtime con el entorno completo.
    pass
