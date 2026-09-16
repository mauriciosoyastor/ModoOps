"""Unittest puro: máquina de estados del cobro QR desktop — sin Odoo, sin red.

Espeja el prototipo `/prototype/pago-qr-desktop` y el brief desktop §2:
idle → processing → success | error, reintento genera orden nueva sin perder el ticket,
éxito imposible sin confirmación real (webhook aprobado).
"""
import unittest
from datetime import datetime, timedelta

from modoops_admin.logic.qr_cobro import (
    TIMEOUT_SECONDS,
    apply_webhook,
    check_timeout,
    new_qr_order,
    retry_order,
)

T0 = datetime(2026, 9, 16, 10, 0, 0)


class NewOrderTests(unittest.TestCase):
    def test_crea_orden_processing_con_vencimiento(self):
        order = new_qr_order(total_cents=1064000, caja="caja-1", ref="MP-ABC", now=T0)
        self.assertEqual(order.state, "processing")
        self.assertEqual(order.expires_at, T0 + timedelta(seconds=TIMEOUT_SECONDS))
        self.assertEqual(order.total_cents, 1064000)

    def test_rechaza_total_no_positivo(self):
        with self.assertRaises(ValueError):
            new_qr_order(total_cents=0, caja="caja-1", ref="MP-ABC", now=T0)


class WebhookTests(unittest.TestCase):
    def test_aprobado_avanza_a_exito(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        done = apply_webhook(order, "approved", T0 + timedelta(seconds=60))
        self.assertEqual(done.state, "success")
        self.assertEqual(done.paid_ref, "MP-ABC")

    def test_rechazado_explica_causa(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        failed = apply_webhook(order, "rejected", T0)
        self.assertEqual(failed.state, "error")
        self.assertTrue(failed.cause)

    def test_evento_desconocido_es_error(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        failed = apply_webhook(order, "raro", T0)
        self.assertEqual(failed.state, "error")

    def test_estado_terminal_es_inmutable(self):
        # Sin este invariante, un webhook duplicado/retrasado podría revivir o voltear un cobro.
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        done = apply_webhook(order, "approved", T0)
        again = apply_webhook(done, "rejected", T0)
        self.assertEqual(again.state, "success")
        self.assertTrue(again.ignored)
        failed = apply_webhook(order, "rejected", T0)
        self.assertEqual(apply_webhook(failed, "approved", T0).state, "error")


class TimeoutTests(unittest.TestCase):
    def test_vence_a_los_5_minutos(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        failed = check_timeout(order, T0 + timedelta(seconds=TIMEOUT_SECONDS))
        self.assertEqual(failed.state, "error")
        self.assertIn("venc", failed.cause)

    def test_antes_del_vencimiento_sigue_esperando(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        same = check_timeout(order, T0 + timedelta(seconds=TIMEOUT_SECONDS - 1))
        self.assertEqual(same.state, "processing")


class RetryTests(unittest.TestCase):
    def test_reintento_genera_orden_nueva_sin_perder_ticket(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        failed = apply_webhook(order, "rejected", T0)
        follow = failed.total_cents
        again = retry_order(failed, ref="MP-DEF", now=T0 + timedelta(minutes=1))
        self.assertEqual(again.state, "processing")
        self.assertEqual(again.paid_ref, "MP-DEF")
        self.assertEqual(again.total_cents, follow)  # el ticket no se pierde

    def test_reintento_solo_desde_error(self):
        order = new_qr_order(1064000, "caja-1", "MP-ABC", T0)
        self.assertIs(retry_order(order, ref="MP-DEF", now=T0), order)


if __name__ == "__main__":
    unittest.main()
