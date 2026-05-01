import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "shared"))

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_service import get_user_by_id, get_users, update_user, update_user_status
from auth.dependencies import CurrentUser, get_current_user
from db.base import get_db
from db.models.subscription import UserSubscription
from db.models.user import UserPaymentMethod

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class UserDetailResponse(BaseModel):
    user_id: UUID
    username: str
    email: str
    mobile_number: str | None
    status: str
    email_verified_flag: bool
    first_name: str | None = None
    last_name: str | None = None
    job_title: str | None = None
    language_preference: str | None = None
    timezone: str | None = None

    model_config = {"from_attributes": True}


class UpdateUserRequest(BaseModel):
    username: str | None = None
    mobile_number: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    job_title: str | None = None
    language_preference: str | None = None
    timezone: str | None = None


class UpdateStatusRequest(BaseModel):
    status: str


class UserProfileResponse(BaseModel):
    first_name: str | None
    last_name: str | None
    date_of_birth: date | None
    gender: str | None
    country: str | None
    job_title: str | None


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    country: str | None = None


class SubscriptionResponse(BaseModel):
    package_name: str
    billing_status: str
    billing_cycle: str
    start_date: date
    end_date: date | None
    next_billing_date: date | None


class BillingOrder(BaseModel):
    order_date: date
    amount: float
    currency: str
    order_status: str
    invoice_number: str
    invoice_url: str | None


class BillingOrdersResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[BillingOrder]


class PaymentMethodResponse(BaseModel):
    payment_method_id: UUID
    card_brand: str | None
    last_four: str
    expiry_month: int
    expiry_year: int
    is_default: bool
    status: str

    model_config = {"from_attributes": True}


class PaymentMethodCreate(BaseModel):
    card_brand: str | None = None
    last_four: str
    expiry_month: int
    expiry_year: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_user(user) -> dict:
    profile = user.profile
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "status": user.status,
        "email_verified_flag": user.email_verified_flag,
        "first_name": profile.first_name if profile else None,
        "last_name": profile.last_name if profile else None,
        "job_title": profile.job_title if profile else None,
        "language_preference": profile.language_preference if profile else None,
        "timezone": profile.timezone if profile else None,
    }


# ── Standard user CRUD ────────────────────────────────────────────────────────

@router.get("", response_model=list[UserDetailResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    users = await get_users(db, skip=skip, limit=limit)
    return [_serialize_user(u) for u in users]


@router.get("/me", response_model=UserDetailResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, current_user.user_id)
    return _serialize_user(user)


@router.patch("/me", response_model=UserDetailResponse)
async def patch_me(
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await update_user(db, current_user.user_id, body.model_dump(exclude_none=True))
    return _serialize_user(user)


# ── Profile sub-resource ───────────────────────────────────────────────────────

@router.get("/me/profile", response_model=UserProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, current_user.user_id)
    profile = user.profile
    return {
        "first_name": profile.first_name if profile else None,
        "last_name": profile.last_name if profile else None,
        "date_of_birth": profile.date_of_birth if profile else None,
        "gender": profile.gender if profile else None,
        "country": profile.country if profile else None,
        "job_title": profile.job_title if profile else None,
    }


@router.patch("/me/profile", response_model=UserProfileResponse)
async def patch_my_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, current_user.user_id)
    if not user.profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    data = body.model_dump(exclude_none=True)
    for key, value in data.items():
        setattr(user.profile, key, value)

    await db.commit()
    await db.refresh(user.profile)
    profile = user.profile
    return {
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "date_of_birth": profile.date_of_birth,
        "gender": profile.gender,
        "country": profile.country,
        "job_title": profile.job_title,
    }


# ── Subscription sub-resource ─────────────────────────────────────────────────

@router.get("/me/subscription", response_model=SubscriptionResponse)
async def get_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UserSubscription).where(
            UserSubscription.user_id == current_user.user_id,
            UserSubscription.billing_status.in_(["active", "trial"]),
        ).order_by(UserSubscription.created_at.desc()).limit(1)
    )
    sub = result.scalar_one_or_none()

    if not sub:
        # Return a default free tier response
        return {
            "package_name": "Free",
            "billing_status": "active",
            "billing_cycle": "monthly",
            "start_date": date.today(),
            "end_date": None,
            "next_billing_date": None,
        }

    from calendar import monthrange

    next_billing: date | None = None
    if sub.end_date:
        next_billing = sub.end_date
    elif sub.billing_cycle == "monthly" and sub.start_date:
        today = date.today()
        month = (today.month % 12) + 1
        year = today.year + (1 if today.month == 12 else 0)
        day = min(sub.start_date.day, monthrange(year, month)[1])
        next_billing = date(year, month, day)

    return {
        "package_name": "Pro",
        "billing_status": sub.billing_status,
        "billing_cycle": sub.billing_cycle,
        "start_date": sub.start_date,
        "end_date": sub.end_date,
        "next_billing_date": next_billing,
    }


# ── Billing orders ─────────────────────────────────────────────────────────────

@router.get("/me/billing/orders", response_model=BillingOrdersResponse)
async def get_billing_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Mock data — real Stripe/payment integration is Phase 6
    mock_orders: list[BillingOrder] = [
        BillingOrder(
            order_date=date(2026, 2, 15),
            amount=25.00,
            currency="USD",
            order_status="failed",
            invoice_number="INV-2026-00123",
            invoice_url=None,
        ),
        BillingOrder(
            order_date=date(2026, 1, 15),
            amount=25.00,
            currency="USD",
            order_status="completed",
            invoice_number="INV-2026-00098",
            invoice_url="/invoices/INV-2026-00098.pdf",
        ),
        BillingOrder(
            order_date=date(2025, 12, 15),
            amount=25.00,
            currency="USD",
            order_status="completed",
            invoice_number="INV-2025-00874",
            invoice_url="/invoices/INV-2025-00874.pdf",
        ),
        BillingOrder(
            order_date=date(2025, 11, 15),
            amount=25.00,
            currency="USD",
            order_status="completed",
            invoice_number="INV-2025-00761",
            invoice_url="/invoices/INV-2025-00761.pdf",
        ),
    ]
    total = len(mock_orders)
    start = (page - 1) * limit
    items = mock_orders[start : start + limit]
    return {"total": total, "page": page, "limit": limit, "items": items}


# ── Payment methods ────────────────────────────────────────────────────────────

@router.get("/me/payment-methods", response_model=list[PaymentMethodResponse])
async def list_payment_methods(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UserPaymentMethod)
        .where(UserPaymentMethod.user_id == current_user.user_id)
        .order_by(UserPaymentMethod.is_default.desc(), UserPaymentMethod.created_at)
    )
    return list(result.scalars().all())


@router.post("/me/payment-methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def add_payment_method(
    body: PaymentMethodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    existing = await db.execute(
        select(func.count()).where(UserPaymentMethod.user_id == current_user.user_id)
    )
    count = existing.scalar_one()

    pm = UserPaymentMethod(
        user_id=current_user.user_id,
        card_brand=body.card_brand,
        last_four=body.last_four,
        expiry_month=body.expiry_month,
        expiry_year=body.expiry_year,
        is_default=(count == 0),  # first card becomes default
        status="active",
    )
    db.add(pm)
    await db.commit()
    await db.refresh(pm)
    return pm


@router.patch("/me/payment-methods/{method_id}/default", response_model=PaymentMethodResponse)
async def set_default_payment_method(
    method_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UserPaymentMethod).where(
            UserPaymentMethod.payment_method_id == method_id,
            UserPaymentMethod.user_id == current_user.user_id,
        )
    )
    pm = result.scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")

    # Clear existing defaults
    all_pms = await db.execute(
        select(UserPaymentMethod).where(UserPaymentMethod.user_id == current_user.user_id)
    )
    for existing_pm in all_pms.scalars().all():
        existing_pm.is_default = False

    pm.is_default = True
    await db.commit()
    await db.refresh(pm)
    return pm


@router.delete("/me/payment-methods/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_payment_method(
    method_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UserPaymentMethod).where(
            UserPaymentMethod.payment_method_id == method_id,
            UserPaymentMethod.user_id == current_user.user_id,
        )
    )
    pm = result.scalar_one_or_none()
    if not pm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")

    await db.delete(pm)
    await db.commit()


# ── Standard user CRUD (by ID) ─────────────────────────────────────────────────

@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await get_user_by_id(db, user_id)
    return _serialize_user(user)


@router.put("/{user_id}", response_model=UserDetailResponse)
async def update_user_endpoint(
    user_id: UUID,
    body: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await update_user(db, user_id, body.model_dump(exclude_none=True))
    return _serialize_user(user)


@router.patch("/{user_id}/status", response_model=UserDetailResponse)
async def patch_user_status(
    user_id: UUID,
    body: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    user = await update_user_status(db, user_id, body.status)
    return _serialize_user(user)
