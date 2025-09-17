const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 2004;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from frontend dist directory
app.use('/assets', express.static('./frontend/dist/assets'));

// Serve React app for dashboard routes
app.get('/dashboard*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Serve main static files (login page, etc.)
app.use(express.static('.'));

// Initialize SQLite database
const db = new sqlite3.Database('gameplanpro.db');

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        division TEXT,
        age_group TEXT,
        skill_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        date_of_birth DATE,
        organization TEXT NOT NULL,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        emergency_contact_relation TEXT,
        medical_alerts TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Add new columns to existing players table if they don't exist
    db.serialize(() => {
        db.run(`ALTER TABLE players ADD COLUMN emergency_contact_name TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding emergency_contact_name column:', err);
            }
        });
        db.run(`ALTER TABLE players ADD COLUMN emergency_contact_phone TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding emergency_contact_phone column:', err);
            }
        });
        db.run(`ALTER TABLE players ADD COLUMN emergency_contact_relation TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding emergency_contact_relation column:', err);
            }
        });
        db.run(`ALTER TABLE players ADD COLUMN medical_alerts TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding medical_alerts column:', err);
            }
        });
        db.run(`ALTER TABLE players ADD COLUMN address TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding address column:', err);
            }
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS roster_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        jersey_number INTEGER,
        position TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams (id),
        FOREIGN KEY (player_id) REFERENCES players (id),
        UNIQUE(team_id, player_id, start_date)
    )`);
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create account endpoint
app.post('/api/create-account', async (req, res) => {
    const { organization, firstName, lastName, email, password } = req.body;

    if (!organization || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into database
        db.run(
            `INSERT INTO users (organization, first_name, last_name, email, password_hash)
             VALUES (?, ?, ?, ?, ?)`,
            [organization, firstName, lastName, email, passwordHash],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ error: 'Email already exists' });
                    }
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create account' });
                }

                res.status(201).json({
                    message: 'Account created successfully',
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { organization, email, password } = req.body;

    if (!organization || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Find user in database
    db.get(
        `SELECT * FROM users WHERE email = ? AND organization = ?`,
        [email, organization],
        async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            try {
                // Check password
                const isPasswordValid = await bcrypt.compare(password, user.password_hash);

                if (!isPasswordValid) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Return user info (without password)
                res.json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        organization: user.organization,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email
                    }
                });
            } catch (error) {
                console.error('Error during login:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    );
});

// Get all users (for testing - remove in production)
app.get('/api/users', (req, res) => {
    db.all(
        `SELECT id, organization, first_name, last_name, email, created_at FROM users`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(rows);
        }
    );
});

// Test endpoints for creating sample data
app.post('/api/teams', (req, res) => {
    const { name, organization, division, age_group, skill_level } = req.body;
    if (!name || !organization) {
        return res.status(400).json({ error: 'name and organization are required' });
    }

    db.run(
        `INSERT INTO teams (name, organization, division, age_group, skill_level)
         VALUES (?, ?, ?, ?, ?)`,
        [name, organization, division, age_group, skill_level],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create team' });
            }
            res.status(201).json({
                message: 'Team created successfully',
                team_id: this.lastID
            });
        }
    );
});

app.post('/api/players', (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        organization,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        medical_alerts,
        address
    } = req.body;

    if (!first_name || !last_name || !organization) {
        return res.status(400).json({ error: 'first_name, last_name, and organization are required' });
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    db.run(
        `INSERT INTO players (first_name, last_name, email, phone, date_of_birth, organization,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_alerts, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, phone, date_of_birth, organization,
         emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_alerts, address],
        function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create player' });
            }
            res.status(201).json({
                message: 'Player created successfully',
                player_id: this.lastID
            });
        }
    );
});

app.get('/api/teams', (req, res) => {
    db.all('SELECT * FROM teams', [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

app.get('/api/players', (req, res) => {
    db.all('SELECT * FROM players', [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
    });
});

// GET /api/players/{id} - Get single player
app.get('/api/players/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM players WHERE id = ?', [id], (err, player) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json(player);
    });
});

// PUT /api/players/{id} - Update player
app.put('/api/players/:id', (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        organization,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        medical_alerts,
        address
    } = req.body;

    if (!first_name || !last_name || !organization) {
        return res.status(400).json({ error: 'first_name, last_name, and organization are required' });
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate player exists
    db.get('SELECT id FROM players WHERE id = ?', [id], (err, player) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Update player
        db.run(
            `UPDATE players SET first_name = ?, last_name = ?, email = ?, phone = ?,
             date_of_birth = ?, organization = ?, emergency_contact_name = ?,
             emergency_contact_phone = ?, emergency_contact_relation = ?,
             medical_alerts = ?, address = ? WHERE id = ?`,
            [first_name, last_name, email, phone, date_of_birth, organization,
             emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
             medical_alerts, address, id],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update player' });
                }

                res.json({
                    message: 'Player updated successfully',
                    changes: this.changes
                });
            }
        );
    });
});

// DELETE /api/players/{id} - Delete player
app.delete('/api/players/:id', (req, res) => {
    const { id } = req.params;

    // Validate player exists
    db.get('SELECT id FROM players WHERE id = ?', [id], (err, player) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Check if player has active roster entries
        db.get(
            'SELECT COUNT(*) as count FROM roster_entries WHERE player_id = ? AND (end_date IS NULL OR end_date > DATE("now"))',
            [id],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (result.count > 0) {
                    return res.status(409).json({
                        error: 'Cannot delete player with active team assignments. Please remove from all teams first.'
                    });
                }

                // Delete player
                db.run('DELETE FROM players WHERE id = ?', [id], function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to delete player' });
                    }

                    res.json({
                        message: 'Player deleted successfully',
                        changes: this.changes
                    });
                });
            }
        );
    });
});

// PUT /api/teams/{id} - Update team
app.put('/api/teams/:id', (req, res) => {
    const { id } = req.params;
    const { name, organization, division, age_group, skill_level } = req.body;

    if (!name || !organization) {
        return res.status(400).json({ error: 'name and organization are required' });
    }

    // Validate team exists
    db.get('SELECT id FROM teams WHERE id = ?', [id], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Update team
        db.run(
            `UPDATE teams SET name = ?, organization = ?, division = ?, age_group = ?, skill_level = ?
             WHERE id = ?`,
            [name, organization, division, age_group, skill_level, id],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update team' });
                }

                res.json({
                    message: 'Team updated successfully',
                    changes: this.changes
                });
            }
        );
    });
});

// DELETE /api/teams/{id} - Delete team
app.delete('/api/teams/:id', (req, res) => {
    const { id } = req.params;

    // Validate team exists
    db.get('SELECT id FROM teams WHERE id = ?', [id], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if team has active roster entries
        db.get(
            'SELECT COUNT(*) as count FROM roster_entries WHERE team_id = ? AND (end_date IS NULL OR end_date > DATE("now"))',
            [id],
            (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (result.count > 0) {
                    return res.status(409).json({
                        error: 'Cannot delete team with active roster entries. Please remove all players first.'
                    });
                }

                // Delete team
                db.run('DELETE FROM teams WHERE id = ?', [id], function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to delete team' });
                    }

                    res.json({
                        message: 'Team deleted successfully',
                        changes: this.changes
                    });
                });
            }
        );
    });
});

// GET /api/teams/{id} - Get single team
app.get('/api/teams/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM teams WHERE id = ?', [id], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.json(team);
    });
});

// Roster Management API Endpoints

// POST /api/teams/{team_id}/roster - Add player to team roster
app.post('/api/teams/:team_id/roster', (req, res) => {
    const { team_id } = req.params;
    const { player_id, start_date, jersey_number, position } = req.body;

    // Validate required fields
    if (!player_id || !start_date) {
        return res.status(400).json({ error: 'player_id and start_date are required' });
    }

    // Validate team exists
    db.get('SELECT id FROM teams WHERE id = ?', [team_id], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Validate player exists
        db.get('SELECT id FROM players WHERE id = ?', [player_id], (err, player) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            // Create roster entry
            db.run(
                `INSERT INTO roster_entries (team_id, player_id, start_date, jersey_number, position)
                 VALUES (?, ?, ?, ?, ?)`,
                [team_id, player_id, start_date, jersey_number || null, position || null],
                function(err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return res.status(409).json({ error: 'Player already on roster for this start date' });
                        }
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to add player to roster' });
                    }

                    res.status(201).json({
                        message: 'Player added to roster successfully',
                        roster_entry_id: this.lastID
                    });
                }
            );
        });
    });
});

// GET /api/teams/{team_id}/roster - Get current roster for team
app.get('/api/teams/:team_id/roster', (req, res) => {
    const { team_id } = req.params;

    // Validate team exists
    db.get('SELECT id, name FROM teams WHERE id = ?', [team_id], (err, team) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Get current roster (entries with end_date in future or null)
        db.all(
            `SELECT
                re.id as roster_entry_id,
                re.start_date,
                re.end_date,
                re.jersey_number,
                re.position,
                p.id as player_id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone,
                p.date_of_birth
             FROM roster_entries re
             JOIN players p ON re.player_id = p.id
             WHERE re.team_id = ? AND (re.end_date IS NULL OR re.end_date > DATE('now'))
             ORDER BY re.jersey_number, p.last_name, p.first_name`,
            [team_id],
            (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({
                    team: team,
                    roster: rows
                });
            }
        );
    });
});

// PUT /api/roster/{roster_entry_id} - Update roster entry
app.put('/api/roster/:roster_entry_id', (req, res) => {
    const { roster_entry_id } = req.params;
    const { jersey_number, position, end_date } = req.body;

    // Validate roster entry exists
    db.get('SELECT id FROM roster_entries WHERE id = ?', [roster_entry_id], (err, entry) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!entry) {
            return res.status(404).json({ error: 'Roster entry not found' });
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (jersey_number !== undefined) {
            updates.push('jersey_number = ?');
            values.push(jersey_number);
        }
        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }
        if (end_date !== undefined) {
            updates.push('end_date = ?');
            values.push(end_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update provided' });
        }

        values.push(roster_entry_id);

        db.run(
            `UPDATE roster_entries SET ${updates.join(', ')} WHERE id = ?`,
            values,
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update roster entry' });
                }

                res.json({
                    message: 'Roster entry updated successfully',
                    changes: this.changes
                });
            }
        );
    });
});

// DELETE /api/roster/{roster_entry_id} - Remove player from roster
app.delete('/api/roster/:roster_entry_id', (req, res) => {
    const { roster_entry_id } = req.params;

    // Validate roster entry exists
    db.get('SELECT id FROM roster_entries WHERE id = ?', [roster_entry_id], (err, entry) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!entry) {
            return res.status(404).json({ error: 'Roster entry not found' });
        }

        // Delete roster entry
        db.run('DELETE FROM roster_entries WHERE id = ?', [roster_entry_id], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to remove player from roster' });
            }

            res.json({
                message: 'Player removed from roster successfully',
                changes: this.changes
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`GamePlanPro server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});