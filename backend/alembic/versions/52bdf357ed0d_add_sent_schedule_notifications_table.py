"""add_sent_schedule_notifications_table

Revision ID: 52bdf357ed0d
Revises: 44ae832540cf
Create Date: 2025-09-22 11:58:35.946650

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '52bdf357ed0d'
down_revision: Union[str, Sequence[str], None] = '44ae832540cf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create sent_schedule_notifications table
    op.create_table(
        'sent_schedule_notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('event_id', UUID(as_uuid=True), sa.ForeignKey('events.id'), nullable=False),
        sa.Column('notification_template_id', UUID(as_uuid=True), nullable=True),
        sa.Column('recipient_user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('sent_at', sa.DateTime, nullable=False),
        sa.Column('delivery_method', sa.String(50), nullable=False),
        sa.Column('content_sent', sa.Text, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='Sent'),
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for sent_schedule_notifications table
    op.create_index('ix_sent_schedule_notifications_event_id', 'sent_schedule_notifications', ['event_id'])
    op.create_index('ix_sent_schedule_notifications_recipient_user_id', 'sent_schedule_notifications', ['recipient_user_id'])
    op.create_index('ix_sent_schedule_notifications_delivery_method', 'sent_schedule_notifications', ['delivery_method'])
    op.create_index('ix_sent_schedule_notifications_status', 'sent_schedule_notifications', ['status'])
    op.create_index('ix_sent_schedule_notifications_sent_at', 'sent_schedule_notifications', ['sent_at'])
    op.create_index('ix_sent_schedule_notifications_created_at', 'sent_schedule_notifications', ['created_at'])
    op.create_index('ix_sent_schedule_notifications_event_user', 'sent_schedule_notifications', ['event_id', 'recipient_user_id'])
    op.create_index('ix_sent_schedule_notifications_user_status', 'sent_schedule_notifications', ['recipient_user_id', 'status'])

    # Add check constraints for enum fields
    op.create_check_constraint(
        'check_delivery_method_valid',
        'sent_schedule_notifications',
        "delivery_method IN ('Email', 'SMS', 'InApp')"
    )

    op.create_check_constraint(
        'check_status_valid',
        'sent_schedule_notifications',
        "status IN ('Sent', 'Failed', 'Delivered', 'Read')"
    )

    # Add check constraint for sent_at not in future
    op.create_check_constraint(
        'check_sent_at_not_future',
        'sent_schedule_notifications',
        "sent_at <= CURRENT_TIMESTAMP"
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop check constraints
    op.drop_constraint('check_sent_at_not_future', 'sent_schedule_notifications')
    op.drop_constraint('check_status_valid', 'sent_schedule_notifications')
    op.drop_constraint('check_delivery_method_valid', 'sent_schedule_notifications')

    # Drop indexes for sent_schedule_notifications table
    op.drop_index('ix_sent_schedule_notifications_user_status', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_event_user', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_created_at', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_sent_at', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_status', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_delivery_method', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_recipient_user_id', 'sent_schedule_notifications')
    op.drop_index('ix_sent_schedule_notifications_event_id', 'sent_schedule_notifications')

    # Drop sent_schedule_notifications table
    op.drop_table('sent_schedule_notifications')
