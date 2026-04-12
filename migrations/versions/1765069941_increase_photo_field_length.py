"""increase photo field length

Revision ID: 1765069941
Revises: 75c453134870
Create Date: 2025-01-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
# revision identifiers, used by Alembic.
revision = '1765069941'
down_revision = '75c453134870'
branch_labels = None
depends_on = None


def _is_sqlite(bind) -> bool:
    return bind.dialect.name == 'sqlite'


def upgrade():
    bind = op.get_bind()
    if _is_sqlite(bind):
        with op.batch_alter_table('profiles', schema=None) as batch_op:
            batch_op.alter_column(
                'photo',
                existing_type=sa.String(length=20),
                type_=sa.String(length=255),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            'profiles',
            'photo',
            existing_type=sa.String(length=20),
            type_=sa.String(length=255),
            existing_nullable=True,
        )


def downgrade():
    bind = op.get_bind()
    if _is_sqlite(bind):
        with op.batch_alter_table('profiles', schema=None) as batch_op:
            batch_op.alter_column(
                'photo',
                existing_type=sa.String(length=255),
                type_=sa.String(length=20),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            'profiles',
            'photo',
            existing_type=sa.String(length=255),
            type_=sa.String(length=20),
            existing_nullable=True,
        )

