"""add_core_tables_users_teams_events_venues

Revision ID: 1805aaba532b
Revises: 52bdf357ed0d
Create Date: 2025-09-22 12:20:50.855667

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '1805aaba532b'
down_revision: Union[str, Sequence[str], None] = '52bdf357ed0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create users table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create teams table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            organization TEXT NOT NULL,
            division TEXT,
            age_group TEXT,
            skill_level TEXT,
            description TEXT,
            external_uuid UUID DEFAULT gen_random_uuid(),
            division_id UUID,
            age_group_id UUID,
            skill_level_id UUID,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create venues table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS venues (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address TEXT,
            city VARCHAR(255),
            state VARCHAR(255),
            zip_code VARCHAR(20),
            phone VARCHAR(20),
            email VARCHAR(255),
            website VARCHAR(255),
            description TEXT,
            capacity INTEGER,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create events table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Practice', 'Game', 'Meeting', 'Tournament', 'Other')),
            start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
            created_by_user_id INTEGER REFERENCES users(id) NOT NULL,
            is_recurring BOOLEAN DEFAULT false,
            recurrence_rule TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT check_start_before_end CHECK (start_time < end_time)
        )
    """)

    # Create event_teams junction table if it doesn't exist
    op.execute("""
        CREATE TABLE IF NOT EXISTS event_teams (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
            team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, team_id)
        )
    """)

    # Create indexes for better performance
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_teams_name ON teams (name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_events_start_time ON events (start_time)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_events_end_time ON events (end_time)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_events_event_type ON events (event_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_event_teams_event_id ON event_teams (event_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_event_teams_team_id ON event_teams (team_id)")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop tables in reverse order due to foreign key dependencies
    op.execute("DROP TABLE IF EXISTS event_teams CASCADE")
    op.execute("DROP TABLE IF EXISTS events CASCADE")
    op.execute("DROP TABLE IF EXISTS venues CASCADE")
    op.execute("DROP TABLE IF EXISTS teams CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
