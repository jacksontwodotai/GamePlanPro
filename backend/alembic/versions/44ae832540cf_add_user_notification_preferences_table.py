"""add_user_notification_preferences_table

Revision ID: 44ae832540cf
Revises: 3797906c0c39
Create Date: 2025-09-22 11:57:41.333575

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '44ae832540cf'
down_revision: Union[str, Sequence[str], None] = '3797906c0c39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_notification_preferences table
    op.create_table(
        'user_notification_preferences',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('event_change_notifications', sa.Boolean, nullable=False, default=True),
        sa.Column('team_id', sa.Integer, sa.ForeignKey('teams.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for user_notification_preferences table
    op.create_index('ix_user_notification_preferences_user_id', 'user_notification_preferences', ['user_id'])
    op.create_index('ix_user_notification_preferences_team_id', 'user_notification_preferences', ['team_id'])
    op.create_index('ix_user_notification_preferences_notification_type', 'user_notification_preferences', ['notification_type'])
    op.create_index('ix_user_notification_preferences_user_team', 'user_notification_preferences', ['user_id', 'team_id'])
    op.create_index('ix_user_notification_preferences_unique', 'user_notification_preferences', ['user_id', 'team_id', 'notification_type'], unique=True)

    # Add check constraint for notification_type enum
    op.create_check_constraint(
        'check_notification_type_valid',
        'user_notification_preferences',
        "notification_type IN ('Email', 'SMS', 'InApp')"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop check constraint
    op.drop_constraint('check_notification_type_valid', 'user_notification_preferences')

    # Drop indexes for user_notification_preferences table
    op.drop_index('ix_user_notification_preferences_unique', 'user_notification_preferences')
    op.drop_index('ix_user_notification_preferences_user_team', 'user_notification_preferences')
    op.drop_index('ix_user_notification_preferences_notification_type', 'user_notification_preferences')
    op.drop_index('ix_user_notification_preferences_team_id', 'user_notification_preferences')
    op.drop_index('ix_user_notification_preferences_user_id', 'user_notification_preferences')

    # Drop user_notification_preferences table
    op.drop_table('user_notification_preferences')
