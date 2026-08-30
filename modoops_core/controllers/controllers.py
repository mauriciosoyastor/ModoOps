# from odoo import http


# class modoopsCore(http.Controller):
#     @http.route('/modoops_core/modoops_core', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/modoops_core/modoops_core/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('modoops_core.listing', {
#             'root': '/modoops_core/modoops_core',
#             'objects': http.request.env['modoops_core.modoops_core'].search([]),
#         })

#     @http.route('/modoops_core/modoops_core/objects/<model("modoops_core.modoops_core"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('modoops_core.object', {
#             'object': obj
#         })

