try:
    from . import models
except ImportError:
    # Permite pytest host sin Odoo para tests de lógica pura / XML
    pass
