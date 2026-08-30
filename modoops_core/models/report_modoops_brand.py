from odoo import api, models
from odoo.tools import file_open

from . import mo_work_order_report_assets as report_assets


class ReportmodoopsBrand(models.AbstractModel):
    _name = "report.modoops.brand"
    _description = "modoops PDF brand helpers"

    @api.model
    def get_mark_src(self):
        """Data-URI del símbolo modoops para QWeb PDF (sin HTTP static)."""
        try:
            with file_open(report_assets.MARK_PRINT_RELATIVE, "rb") as handle:
                raw = handle.read()
        except (FileNotFoundError, OSError, ValueError):
            return ""
        return report_assets.mark_data_uri_or_empty(raw)
