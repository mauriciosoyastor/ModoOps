try:
    from . import models
    from . import controllers
except ImportError:
    # Permite `pytest` host sin Odoo para tests de lógica pura (`modoops_ia/logic/*`)
    # Odoo sólo lo importa en runtime con el entorno completo.
    pass
