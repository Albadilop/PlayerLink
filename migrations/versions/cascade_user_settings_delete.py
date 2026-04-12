"""user_settings.user_id references users.id with ON DELETE CASCADE (Postgres).

SQLite: FK change omitted; the API deletes UserSettings explicitly before deleting User.

Revision ID: cascade_user_settings_delete
Revises: pending_email_users
Create Date: 2026-04-12

"""
from alembic import op
import sqlalchemy as sa

revision = "cascade_user_settings_delete"
down_revision = "pending_email_users"
branch_labels = None
depends_on = None


def _user_settings_user_id_fk_name(conn) -> str | None:
    insp = sa.inspect(conn)
    for fk in insp.get_foreign_keys("user_settings"):
        cols = list(fk.get("constrained_columns") or [])
        if fk.get("referred_table") == "users" and cols == ["user_id"]:
            return fk.get("name")
    return None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    fk_name = _user_settings_user_id_fk_name(bind)
    if fk_name:
        op.drop_constraint(fk_name, "user_settings", type_="foreignkey")
    op.create_foreign_key(
        fk_name or "user_settings_user_id_fkey",
        "user_settings",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    fk_name = _user_settings_user_id_fk_name(bind)
    if fk_name:
        op.drop_constraint(fk_name, "user_settings", type_="foreignkey")
    op.create_foreign_key(
        fk_name or "user_settings_user_id_fkey",
        "user_settings",
        "users",
        ["user_id"],
        ["id"],
    )
