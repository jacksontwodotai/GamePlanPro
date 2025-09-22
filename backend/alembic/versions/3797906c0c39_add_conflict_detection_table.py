"""Add conflict detection table

Revision ID: 3797906c0c39
Revises: 62992c653602
Create Date: 2025-09-22 10:29:54.386943

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '3797906c0c39'
down_revision: Union[str, Sequence[str], None] = '62992c653602'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create conflicts table
    op.create_table(
        'conflicts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('event_id', UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conflicting_event_id', UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conflict_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=False),
        sa.Column('severity', sa.Integer, nullable=False, default=5),
        sa.Column('is_resolved', sa.Boolean, nullable=False, default=False),
        sa.Column('resolved_at', sa.DateTime, nullable=True),
        sa.Column('detected_by', sa.String(255), nullable=False, default='system'),
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for conflicts table
    op.create_index('ix_conflicts_event_id', 'conflicts', ['event_id'])
    op.create_index('ix_conflicts_conflicting_event_id', 'conflicts', ['conflicting_event_id'])
    op.create_index('ix_conflicts_conflict_type', 'conflicts', ['conflict_type'])
    op.create_index('ix_conflicts_resource', 'conflicts', ['resource_type', 'resource_id'])
    op.create_index('ix_conflicts_is_resolved', 'conflicts', ['is_resolved'])
    op.create_index('ix_conflicts_created_at', 'conflicts', ['created_at'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes for conflicts table
    op.drop_index('ix_conflicts_created_at', 'conflicts')
    op.drop_index('ix_conflicts_is_resolved', 'conflicts')
    op.drop_index('ix_conflicts_resource', 'conflicts')
    op.drop_index('ix_conflicts_conflict_type', 'conflicts')
    op.drop_index('ix_conflicts_conflicting_event_id', 'conflicts')
    op.drop_index('ix_conflicts_event_id', 'conflicts')

    # Drop conflicts table
    op.drop_table('conflicts')
