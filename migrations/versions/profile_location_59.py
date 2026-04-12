"""profiles.location length 50 -> 24

Revision ID: profile_location_59
Revises: pending_email_users
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa

revision = "profile_location_59"
down_revision = "pending_email_users"
branch_labels = None
depends_on = None


def _is_sqlite(bind) -> bool:
    return bind.dialect.name == "sqlite"


def upgrade():
    bind = op.get_bind()
    # Shorten existing values before shrinking the column (avoids migration errors).
    if bind.dialect.name == "postgresql":
        op.execute(
            sa.text(
                "UPDATE profiles SET location = LEFT(location, 24) "
                "WHERE location IS NOT NULL AND char_length(location) > 24"
            )
        )
    elif _is_sqlite(bind):
        op.execute(
            sa.text(
                "UPDATE profiles SET location = substr(location, 1, 24) "
                "WHERE location IS NOT NULL AND length(location) > 24"
            )
        )
    if _is_sqlite(bind):
        with op.batch_alter_table("profiles", schema=None) as batch_op:
            batch_op.alter_column(
                "location",
                existing_type=sa.String(length=50),
                type_=sa.String(length=24),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "profiles",
            "location",
            existing_type=sa.String(length=50),
            type_=sa.String(length=24),
            existing_nullable=True,
        )


def downgrade():
    bind = op.get_bind()
    if _is_sqlite(bind):
        with op.batch_alter_table("profiles", schema=None) as batch_op:
            batch_op.alter_column(
                "location",
                existing_type=sa.String(length=24),
                type_=sa.String(length=50),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "profiles",
            "location",
            existing_type=sa.String(length=24),
            type_=sa.String(length=50),
            existing_nullable=True,
        )
