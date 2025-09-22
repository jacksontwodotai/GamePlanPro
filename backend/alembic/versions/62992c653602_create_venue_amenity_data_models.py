"""Create venue amenity data models

Revision ID: 62992c653602
Revises: 
Create Date: 2025-09-22 09:34:49.375533

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '62992c653602'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create venue_amenities table
    op.create_table(
        'venue_amenities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), unique=True, nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for venue_amenities table
    op.create_index('ix_venue_amenities_name', 'venue_amenities', ['name'])
    op.create_index('ix_venue_amenities_is_active', 'venue_amenities', ['is_active'])

    # Create venue_has_amenities table
    op.create_table(
        'venue_has_amenities',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('venue_id', UUID(as_uuid=True), sa.ForeignKey('venues.id'), nullable=False),
        sa.Column('amenity_id', UUID(as_uuid=True), sa.ForeignKey('venue_amenities.id'), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for venue_has_amenities table
    op.create_index('ix_venue_has_amenities_venue_id', 'venue_has_amenities', ['venue_id'])
    op.create_index('ix_venue_has_amenities_amenity_id', 'venue_has_amenities', ['amenity_id'])
    op.create_index('ix_venue_has_amenities_unique', 'venue_has_amenities', ['venue_id', 'amenity_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes for venue_has_amenities table
    op.drop_index('ix_venue_has_amenities_unique', 'venue_has_amenities')
    op.drop_index('ix_venue_has_amenities_amenity_id', 'venue_has_amenities')
    op.drop_index('ix_venue_has_amenities_venue_id', 'venue_has_amenities')

    # Drop venue_has_amenities table
    op.drop_table('venue_has_amenities')

    # Drop indexes for venue_amenities table
    op.drop_index('ix_venue_amenities_is_active', 'venue_amenities')
    op.drop_index('ix_venue_amenities_name', 'venue_amenities')

    # Drop venue_amenities table
    op.drop_table('venue_amenities')
