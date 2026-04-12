"""Add supabase_auth_id to users (Fase 3: mapeo auth.users.id ↔ users.id)

Revision ID: f3_supabase_auth_id
Revises: add_created_at_reviews
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa

revision = "f3_supabase_auth_id"
down_revision = "add_created_at_reviews"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("supabase_auth_id", sa.String(length=36), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_supabase_auth_id",
        "users",
        ["supabase_auth_id"],
    )


def downgrade():
    op.drop_constraint("uq_users_supabase_auth_id", "users", type_="unique")
    op.drop_column("users", "supabase_auth_id")
