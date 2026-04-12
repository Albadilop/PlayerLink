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


def _is_sqlite(bind) -> bool:
    return bind.dialect.name == "sqlite"


def upgrade():
    bind = op.get_bind()
    if _is_sqlite(bind):
        with op.batch_alter_table("users", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column("supabase_auth_id", sa.String(length=36), nullable=True),
            )
            batch_op.create_unique_constraint(
                "uq_users_supabase_auth_id",
                ["supabase_auth_id"],
            )
    else:
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
    bind = op.get_bind()
    if _is_sqlite(bind):
        with op.batch_alter_table("users", schema=None) as batch_op:
            batch_op.drop_constraint("uq_users_supabase_auth_id", type_="unique")
            batch_op.drop_column("supabase_auth_id")
    else:
        op.drop_constraint("uq_users_supabase_auth_id", "users", type_="unique")
        op.drop_column("users", "supabase_auth_id")
