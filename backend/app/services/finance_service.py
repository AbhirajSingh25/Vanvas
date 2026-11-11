"""
VANVAS Financial Calculation Service
Canonical accounting using integer paise with Decimal precision.
Handles Equal, Exact, Percentage, Shares, and Itemized splits,
net balance calculations, debt simplification, and audit logging.
"""

from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
import json
from app.api.v1.budget import simplify_debts_algorithm


def to_paise(amount: float) -> int:
    """Convert float currency (INR) to exact integer paise."""
    d = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(d * 100)


def from_paise(paise: int) -> float:
    """Convert integer paise back to float INR with 2 decimal places."""
    return float(Decimal(paise) / Decimal(100))


class FinanceCalculationException(Exception):
    def __init__(self, message: str, code: str = "INVALID_FINANCE_DATA"):
        super().__init__(message)
        self.message = message
        self.code = code


def calculate_split_shares(
    total_amount: float,
    split_method: str,
    participant_user_ids: List[str],
    split_data: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Calculate exact participant shares for an expense.
    Guarantees:
      1. Zero floating point rounding drift.
      2. Sum of participant owed_amounts equals total_amount down to exact paise.
      3. Empty participants list raises FinanceCalculationException.
      4. Invalid/negative amounts raise FinanceCalculationException.
    """
    if total_amount <= 0:
        raise FinanceCalculationException("Expense total amount must be strictly positive", "INVALID_AMOUNT")

    if not participant_user_ids:
        raise FinanceCalculationException("At least one participant must be selected", "NO_PARTICIPANTS")

    total_paise = to_paise(total_amount)
    n = len(participant_user_ids)
    method = split_method.upper()

    if method == "EQUAL":
        base_paise = total_paise // n
        remainder_paise = total_paise % n

        shares = []
        for i, uid in enumerate(participant_user_ids):
            # Deterministically distribute remainder paise to the first remainder_paise participants
            allocated_paise = base_paise + (1 if i < remainder_paise else 0)
            shares.append({
                "user_id": uid,
                "owed_amount": from_paise(allocated_paise),
                "percentage": round((allocated_paise / total_paise) * 100, 2),
                "shares_count": 1.0,
            })
        return shares

    elif method == "EXACT":
        if not split_data or "exact_amounts" not in split_data:
            raise FinanceCalculationException("Exact split requires 'exact_amounts' map", "MISSING_SPLIT_DATA")

        exact_map = split_data["exact_amounts"]
        allocated_paise_sum = 0
        shares = []

        for uid in participant_user_ids:
            amt = float(exact_map.get(uid, 0.0))
            if amt < 0:
                raise FinanceCalculationException(f"Negative share amount for user {uid}", "NEGATIVE_AMOUNT")
            paise = to_paise(amt)
            allocated_paise_sum += paise
            shares.append({
                "user_id": uid,
                "owed_amount": from_paise(paise),
                "percentage": round((paise / total_paise) * 100, 2) if total_paise > 0 else 0.0,
                "shares_count": None,
            })

        if allocated_paise_sum != total_paise:
            diff = from_paise(abs(allocated_paise_sum - total_paise))
            raise FinanceCalculationException(
                f"Sum of exact amounts (₹{from_paise(allocated_paise_sum)}) does not equal expense total (₹{total_amount}). Difference: ₹{diff}",
                "SUM_MISMATCH"
            )
        return shares

    elif method == "PERCENTAGE":
        if not split_data or "percentages" not in split_data:
            raise FinanceCalculationException("Percentage split requires 'percentages' map", "MISSING_SPLIT_DATA")

        pct_map = split_data["percentages"]
        total_pct = sum(float(pct_map.get(uid, 0.0)) for uid in participant_user_ids)
        if abs(total_pct - 100.0) > 0.01:
            raise FinanceCalculationException(
                f"Percentages must sum to 100%. Current sum: {total_pct:.2f}%",
                "PERCENTAGE_MISMATCH"
            )

        paise_allocations = []
        allocated_sum = 0
        for uid in participant_user_ids:
            pct = float(pct_map.get(uid, 0.0))
            p_share = int(round(Decimal(str(total_paise)) * Decimal(str(pct)) / Decimal("100")))
            paise_allocations.append((uid, p_share, pct))
            allocated_sum += p_share

        # Reconcile any rounding difference to ensure sum(owed_amounts) == total_amount
        remainder = total_paise - allocated_sum
        shares = []
        for i, (uid, p_share, pct) in enumerate(paise_allocations):
            adj = 0
            if remainder != 0:
                adj = 1 if remainder > 0 else -1
                remainder -= adj
            final_paise = p_share + adj
            shares.append({
                "user_id": uid,
                "owed_amount": from_paise(final_paise),
                "percentage": pct,
                "shares_count": None,
            })
        return shares

    elif method == "SHARES":
        if not split_data or "shares" not in split_data:
            raise FinanceCalculationException("Shares split requires 'shares' map", "MISSING_SPLIT_DATA")

        shares_map = split_data["shares"]
        total_weight = sum(float(shares_map.get(uid, 1.0)) for uid in participant_user_ids)
        if total_weight <= 0:
            raise FinanceCalculationException("Total weights/shares must be positive", "INVALID_WEIGHT")

        paise_allocations = []
        allocated_sum = 0
        for uid in participant_user_ids:
            w = float(shares_map.get(uid, 1.0))
            if w < 0:
                raise FinanceCalculationException(f"Negative weight for user {uid}", "NEGATIVE_WEIGHT")
            p_share = int(round(Decimal(str(total_paise)) * Decimal(str(w)) / Decimal(str(total_weight))))
            paise_allocations.append((uid, p_share, w))
            allocated_sum += p_share

        remainder = total_paise - allocated_sum
        shares = []
        for i, (uid, p_share, w) in enumerate(paise_allocations):
            adj = 0
            if remainder != 0:
                adj = 1 if remainder > 0 else -1
                remainder -= adj
            final_paise = p_share + adj
            shares.append({
                "user_id": uid,
                "owed_amount": from_paise(final_paise),
                "percentage": round((final_paise / total_paise) * 100, 2),
                "shares_count": w,
            })
        return shares

    elif method in ("ITEMIZED", "CUSTOM"):
        if not split_data or "items" not in split_data:
            # Fallback to equal if no items breakdown provided
            return calculate_split_shares(total_amount, "EQUAL", participant_user_ids)

        items = split_data["items"]
        item_total_paise = sum(to_paise(float(it.get("amount", 0.0))) for it in items)
        if item_total_paise != total_paise:
            raise FinanceCalculationException(
                f"Sum of itemized lines (₹{from_paise(item_total_paise)}) does not match expense total (₹{total_amount})",
                "ITEM_SUM_MISMATCH"
            )

        user_paise_map = {uid: 0 for uid in participant_user_ids}
        for it in items:
            it_amt_paise = to_paise(float(it.get("amount", 0.0)))
            it_users = it.get("participant_user_ids", []) or participant_user_ids
            it_n = len(it_users)
            if it_n == 0:
                continue
            base = it_amt_paise // it_n
            rem = it_amt_paise % it_n
            for j, u in enumerate(it_users):
                if u in user_paise_map:
                    user_paise_map[u] += base + (1 if j < rem else 0)

        shares = []
        for uid in participant_user_ids:
            p = user_paise_map[uid]
            shares.append({
                "user_id": uid,
                "owed_amount": from_paise(p),
                "percentage": round((p / total_paise) * 100, 2) if total_paise > 0 else 0.0,
                "shares_count": None,
                "item_details_json": json.dumps(items),
            })
        return shares

    else:
        raise FinanceCalculationException(f"Unsupported split method '{split_method}'", "UNSUPPORTED_METHOD")


def validate_payers_allocation(total_amount: float, payers_json: Optional[str], default_payer_id: str) -> List[Dict[str, Any]]:
    """
    Validate single or multiple payers against total amount.
    Returns parsed list of [{'user_id': str, 'amount': float}].
    """
    total_paise = to_paise(total_amount)
    if not payers_json:
        return [{"user_id": default_payer_id, "amount": total_amount}]

    try:
        payers = json.loads(payers_json)
        if not isinstance(payers, list) or len(payers) == 0:
            return [{"user_id": default_payer_id, "amount": total_amount}]

        payer_paise_sum = 0
        parsed_payers = []
        for p in payers:
            u_id = p.get("user_id")
            amt = float(p.get("amount", 0.0))
            if not u_id or amt <= 0:
                raise FinanceCalculationException("Every payer entry must have a valid user_id and positive amount", "INVALID_PAYER")
            paise = to_paise(amt)
            payer_paise_sum += paise
            parsed_payers.append({"user_id": u_id, "amount": from_paise(paise)})

        if payer_paise_sum != total_paise:
            raise FinanceCalculationException(
                f"Sum of payer contributions (₹{from_paise(payer_paise_sum)}) does not equal expense total (₹{total_amount})",
                "PAYER_SUM_MISMATCH"
            )
        return parsed_payers
    except json.JSONDecodeError:
        return [{"user_id": default_payer_id, "amount": total_amount}]


def calculate_group_balances(
    member_user_ids: List[str],
    expenses: List[Any],
    settlements: List[Any],
    user_names: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Compute net balances and debt simplification for an isolated financial context
    (Trip, Crew Circle, or Split Pod).
    """
    user_names = user_names or {}
    # Track amounts in integer paise for precision
    paid_paise: Dict[str, int] = {uid: 0 for uid in member_user_ids}
    share_paise: Dict[str, int] = {uid: 0 for uid in member_user_ids}
    settled_paid_paise: Dict[str, int] = {uid: 0 for uid in member_user_ids}
    settled_recv_paise: Dict[str, int] = {uid: 0 for uid in member_user_ids}

    # Aggregate expenses
    total_expense_paise = 0
    for exp in expenses:
        if getattr(exp, "is_deleted", False):
            continue

        exp_total = getattr(exp, "amount", 0.0)
        total_expense_paise += to_paise(exp_total)

        # Handle multiple or single payer
        payers_raw = getattr(exp, "payers_json", None)
        if payers_raw:
            try:
                payers_list = json.loads(payers_raw)
                for p in payers_list:
                    p_uid = p.get("user_id")
                    if p_uid in paid_paise:
                        paid_paise[p_uid] += to_paise(float(p.get("amount", 0.0)))
            except Exception:
                p_uid = getattr(exp, "user_id", None)
                if p_uid in paid_paise:
                    paid_paise[p_uid] += to_paise(exp_total)
        else:
            p_uid = getattr(exp, "user_id", None)
            if p_uid in paid_paise:
                paid_paise[p_uid] += to_paise(exp_total)

        # Aggregate shares
        for share in getattr(exp, "shares", []):
            s_uid = getattr(share, "user_id", None)
            owed = getattr(share, "owed_amount", 0.0)
            if s_uid in share_paise:
                share_paise[s_uid] += to_paise(owed)

    # Aggregate settlements
    total_settled_paise = 0
    for st in settlements:
        payer = getattr(st, "payer_user_id", None)
        receiver = getattr(st, "receiver_user_id", None)
        amt = getattr(st, "amount", 0.0)
        amt_paise = to_paise(amt)
        total_settled_paise += amt_paise

        if payer in settled_paid_paise:
            settled_paid_paise[payer] += amt_paise
        if receiver in settled_recv_paise:
            settled_recv_paise[receiver] += amt_paise

    # Calculate net balance in paise:
    # Net balance = (paid + settled_paid) - (share + settled_received)
    net_paise: Dict[str, int] = {}
    member_summaries = []

    for uid in member_user_ids:
        p = paid_paise[uid]
        s = share_paise[uid]
        sp = settled_paid_paise[uid]
        sr = settled_recv_paise[uid]
        net = (p + sp) - (s + sr)
        net_paise[uid] = net

        member_summaries.append({
            "user_id": uid,
            "user_name": user_names.get(uid, f"User {uid}"),
            "total_paid": from_paise(p),
            "total_share": from_paise(s),
            "settled_paid": from_paise(sp),
            "settled_received": from_paise(sr),
            "net_balance": from_paise(net),
            "status": "settled" if abs(net) < 2 else ("owes" if net < 0 else "owed"),
        })

    # Run debt simplification algorithm
    net_float_map = {uid: from_paise(bal) for uid, bal in net_paise.items()}
    simplified_debts = simplify_debts_algorithm(net_float_map, user_names)

    return {
        "total_shared_expenses": from_paise(total_expense_paise),
        "total_settled": from_paise(total_settled_paise),
        "members": member_summaries,
        "simplified_debts": simplified_debts,
    }

