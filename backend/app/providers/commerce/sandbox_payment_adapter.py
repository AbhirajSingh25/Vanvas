"""
VANVAS Sandbox Payment Gateway Adapter
Provides deterministic server-side payment order lifecycle, HMAC-SHA256 signature generation/verification,
and gateway transaction state lookup. Prevents clients from manufacturing SUCCESS by themselves.
"""

import hmac
import hashlib
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger("vanvas.providers.sandbox_payment")

SANDBOX_PAYMENT_SECRET = "vanvas_sandbox_payment_secret_2026_hardened"

# Server-side transaction state store
_SANDBOX_ORDERS: Dict[str, Dict[str, Any]] = {}
_SANDBOX_PAYMENTS: Dict[str, Dict[str, Any]] = {}


class SandboxPaymentGateway:
    """
    Deterministic Sandbox Payment Gateway.
    Simulates live payment gateway semantics with verifiable cryptographic signatures.
    """
    SECRET_KEY = SANDBOX_PAYMENT_SECRET

    @classmethod
    def reset_state(cls):
        """Clears state for test isolation."""
        _SANDBOX_ORDERS.clear()
        _SANDBOX_PAYMENTS.clear()

    @classmethod
    def generate_signature(cls, order_id: str, payment_id: str) -> str:
        """Computes authoritative server-side HMAC signature."""
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(cls.SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    @classmethod
    def verify_signature(cls, order_id: str, payment_id: str, signature: Optional[str]) -> bool:
        """Constant-time cryptographic verification of sandbox signature."""
        if not signature or not order_id or not payment_id:
            return False
        expected = cls.generate_signature(order_id, payment_id)
        return hmac.compare_digest(expected, signature)

    @classmethod
    def create_order(
        cls,
        order_id: str,
        amount: float,
        currency: str = "INR",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        order = {
            "order_id": order_id,
            "amount": float(amount),
            "currency": currency.upper(),
            "status": "CREATED",
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _SANDBOX_ORDERS[order_id] = order
        return order

    @classmethod
    def authorize(cls, order_id: str, payment_id: str) -> Dict[str, Any]:
        order = _SANDBOX_ORDERS.get(order_id)
        if not order:
            raise ValueError(f"Order {order_id} not found in sandbox gateway")

        payment = {
            "payment_id": payment_id,
            "order_id": order_id,
            "amount": order["amount"],
            "currency": order["currency"],
            "status": "AUTHORIZED",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _SANDBOX_PAYMENTS[payment_id] = payment
        order["status"] = "AUTHORIZED"
        return payment

    @classmethod
    def capture(cls, order_id: str, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        order = _SANDBOX_ORDERS.get(order_id)
        if not order:
            # If not in active memory, check deterministic pattern
            if "fail" in order_id.lower() or "reject" in order_id.lower():
                payment = {
                    "payment_id": payment_id,
                    "order_id": order_id,
                    "amount": amount or 0.0,
                    "currency": "INR",
                    "status": "FAILED",
                    "error": "Simulated sandbox payment failure",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                _SANDBOX_PAYMENTS[payment_id] = payment
                return payment
            raise ValueError(f"Order {order_id} not found in sandbox gateway")

        expected_amount = order["amount"]
        if amount is not None and round(float(amount), 2) != round(expected_amount, 2):
            raise ValueError(f"Amount mismatch: expected {expected_amount}, got {amount}")

        # Simulated failures
        if "fail" in order_id.lower() or "fail" in payment_id.lower() or "reject" in payment_id.lower():
            payment = {
                "payment_id": payment_id,
                "order_id": order_id,
                "amount": expected_amount,
                "currency": order["currency"],
                "status": "FAILED",
                "error": "Simulated sandbox card/UPI transaction failure",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            _SANDBOX_PAYMENTS[payment_id] = payment
            order["status"] = "FAILED"
            return payment

        payment = {
            "payment_id": payment_id,
            "order_id": order_id,
            "amount": expected_amount,
            "currency": order["currency"],
            "status": "CAPTURED",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        _SANDBOX_PAYMENTS[payment_id] = payment
        order["status"] = "CAPTURED"
        return payment

    @classmethod
    def fail_payment(cls, order_id: str, payment_id: str, reason: str = "Payment failed") -> Dict[str, Any]:
        order = _SANDBOX_ORDERS.get(order_id)
        payment = {
            "payment_id": payment_id,
            "order_id": order_id,
            "amount": order["amount"] if order else 0.0,
            "currency": order["currency"] if order else "INR",
            "status": "FAILED",
            "error_reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        _SANDBOX_PAYMENTS[payment_id] = payment
        if order:
            order["status"] = "FAILED"
        return payment

    @classmethod
    def refund(cls, payment_id: str, amount: Optional[float] = None, reason: Optional[str] = None) -> Dict[str, Any]:
        payment = _SANDBOX_PAYMENTS.get(payment_id)
        if not payment:
            # Deterministic simulation for test cases
            if "cant_refund" in payment_id.lower() or "refund_fail" in payment_id.lower():
                return {
                    "payment_id": payment_id,
                    "status": "REFUND_FAILED",
                    "refund_status": "FAILED",
                    "error": "Simulated gateway refund failure",
                }
            if "refund_pending" in payment_id.lower():
                return {
                    "payment_id": payment_id,
                    "refund_id": f"rfnd_{uuid.uuid4().hex[:8]}",
                    "status": "REFUND_PENDING",
                    "refund_status": "PENDING",
                    "refund_amount": amount or 0.0,
                }
            return {
                "payment_id": payment_id,
                "refund_id": f"rfnd_{uuid.uuid4().hex[:8]}",
                "status": "REFUNDED",
                "refund_status": "COMPLETED",
                "refund_amount": amount or 0.0,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }

        if "cant_refund" in payment_id.lower() or "refund_fail" in payment_id.lower():
            return {
                "payment_id": payment_id,
                "status": "REFUND_FAILED",
                "refund_status": "FAILED",
                "error": "Simulated gateway refund failure",
            }

        if "refund_pending" in payment_id.lower():
            payment["status"] = "REFUND_PENDING"
            return {
                "payment_id": payment_id,
                "refund_id": f"rfnd_{uuid.uuid4().hex[:8]}",
                "status": "REFUND_PENDING",
                "refund_status": "PENDING",
                "refund_amount": amount or payment.get("amount", 0.0),
            }

        payment["status"] = "REFUNDED"
        payment["refund_amount"] = amount or payment.get("amount", 0.0)
        return {
            "payment_id": payment_id,
            "refund_id": f"rfnd_{uuid.uuid4().hex[:8]}",
            "status": "REFUNDED",
            "refund_status": "COMPLETED",
            "refund_amount": payment["refund_amount"],
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }

    @classmethod
    def get_order(cls, order_id: str) -> Optional[Dict[str, Any]]:
        return _SANDBOX_ORDERS.get(order_id)

    @classmethod
    def get_payment(cls, payment_id: str) -> Optional[Dict[str, Any]]:
        return _SANDBOX_PAYMENTS.get(payment_id)

    @classmethod
    def query_status(cls, order_id: Optional[str] = None, payment_id: Optional[str] = None) -> Dict[str, Any]:
        """Queries gateway external state for reconciliation."""
        if payment_id and payment_id in _SANDBOX_PAYMENTS:
            return _SANDBOX_PAYMENTS[payment_id]
        if order_id and order_id in _SANDBOX_ORDERS:
            return _SANDBOX_ORDERS[order_id]

        if order_id and ("fail" in order_id.lower() or "rejected" in order_id.lower()):
            return {"order_id": order_id, "status": "FAILED"}
        if payment_id and ("fail" in payment_id.lower() or "rejected" in payment_id.lower()):
            return {"payment_id": payment_id, "status": "FAILED"}

        return {"status": "UNKNOWN", "order_id": order_id, "payment_id": payment_id}
