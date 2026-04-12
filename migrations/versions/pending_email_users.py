"""Add pending_email for verified email change flow

Revision ID: pending_email_users
Revises: f3_supabase_auth_id
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "pending_email_users"
down_revision = "f3_supabase_auth_id"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns("users")}
    if "pending_email" not in cols:
        op.add_column(
            "users",
            sa.Column("pending_email", sa.String(length=120), nullable=True),
        )


def downgrade():
    bind = op.get_bind()
    cols = {c["name"] for c in inspect(bind).get_columns("users")}
    if "pending_email" in cols:
        op.drop_column("users", "pending_email")
