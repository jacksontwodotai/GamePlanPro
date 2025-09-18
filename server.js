const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 2004;

// Initialize Supabase client
const supabaseUrl = 'https://xsuaxjaijknvnrxgfpqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdWF4amFpamtudm5yeGdmcHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTIxNzIsImV4cCI6MjA3MzU2ODE3Mn0.uNilBSWxyhr7hCTtr_9DI2AY7ppbTYlgo-MS0bao0-w';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend dist directory
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Serve React app for all routes (SPA)
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // Serve React app for all other routes
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// Create account endpoint
app.post('/api/create-account', async (req, res) => {
    const { organization, firstName, lastName, email, password, role } = req.body;

    if (!organization || !firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const userRole = role === 'admin' ? 'admin' : 'user'; // Validate role

    try {
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    organization,
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password_hash: passwordHash,
                    role: userRole
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: 'Failed to create account' });
        }

        res.status(201).json({
            message: 'Account created successfully',
            user_id: data.id
        });
    } catch (error) {
        console.error('Account creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Get user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user data without password
        res.json({
            user: {
                id: user.id,
                organization: user.organization,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role || 'user',
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Teams endpoints
app.post('/api/teams', async (req, res) => {
    const { name, organization, division, age_group, skill_level } = req.body;

    if (!name || !organization) {
        return res.status(400).json({ error: 'Name and organization are required' });
    }

    try {
        const { data, error } = await supabase
            .from('teams')
            .insert([{ name, organization, division, age_group, skill_level }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create team' });
        }

        res.status(201).json({
            message: 'Team created successfully',
            team_id: data.id
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/teams', async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const name = req.query.name || '';

    try {
        let query = supabase
            .from('teams')
            .select('*', { count: 'exact' });

        // Add name filter if provided
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }

        // Add pagination and ordering
        query = query
            .order('name')
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            teams: data,
            total: count,
            limit: limit,
            offset: offset
        });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/teams/{id} - Get single team
app.get('/api/teams/:id', async (req, res) => {
    const { id } = req.params;
    const includePlayers = req.query.includePlayers === 'true';

    try {
        // Get team details
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', id)
            .single();

        if (teamError) {
            console.error('Supabase error:', teamError);
            if (teamError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        // If includePlayers is true, get associated players
        if (includePlayers) {
            const { data: roster, error: rosterError } = await supabase
                .from('roster_entries')
                .select(`
                    *,
                    players (*)
                `)
                .eq('team_id', id)
                .is('end_date', null); // Only get active roster entries

            if (rosterError) {
                console.error('Roster error:', rosterError);
                // Don't fail the whole request if roster fetch fails
                team.players = [];
            } else {
                team.players = roster.map(entry => ({
                    ...entry.players,
                    jersey_number: entry.jersey_number,
                    position: entry.position,
                    start_date: entry.start_date
                }));
            }
        }

        res.json(team);
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication middleware placeholder - will be moved before players endpoints
let authenticateUser;

// Players endpoints
app.post('/api/players', async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
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

    // Gender validation
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        return res.status(400).json({ error: 'Invalid gender value' });
    }

    try {
        const { data, error } = await supabase
            .from('players')
            .insert([{
                first_name,
                last_name,
                email,
                phone,
                date_of_birth,
                gender,
                organization,
                emergency_contact_name,
                emergency_contact_phone,
                emergency_contact_relation,
                medical_alerts,
                address
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create player' });
        }

        res.status(201).json({
            message: 'Player created successfully',
            player_id: data.id
        });
    } catch (error) {
        console.error('Create player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/players', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const team_id = req.query.team_id;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query;

        // If filtering by team_id, join with roster_entries
        if (team_id) {
            query = supabase
                .from('roster_entries')
                .select(`
                    player_id,
                    players (*)
                `, { count: 'exact' })
                .eq('team_id', team_id)
                .is('end_date', null); // Only active roster entries
        } else {
            query = supabase
                .from('players')
                .select('*', { count: 'exact' });
        }

        // Add search filter if provided
        if (search && !team_id) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,organization.ilike.%${search}%`);
        } else if (search && team_id) {
            // For team filtering, search on the joined players data
            query = query.or(`players.first_name.ilike.%${search}%,players.last_name.ilike.%${search}%,players.email.ilike.%${search}%`);
        }

        // Add pagination and ordering
        if (team_id) {
            query = query
                .order('players(last_name)', { ascending: true })
                .order('players(first_name)', { ascending: true })
                .range(from, to);
        } else {
            query = query
                .order('last_name', { ascending: true })
                .order('first_name', { ascending: true })
                .range(from, to);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Format response based on whether team filtering was used
        const players = team_id && data ? data.map(entry => entry.players) : data;

        res.json({
            players: players,
            pagination: {
                page: page,
                limit: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/players/{id} - Get single player with roster history
app.get('/api/players/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Get player details
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', id)
            .single();

        if (playerError) {
            console.error('Supabase error:', playerError);
            if (playerError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }


        // Get roster history (current and past team assignments)
        const { data: rosterHistory, error: rosterError } = await supabase
            .from('roster_entries')
            .select(`
                *,
                teams (id, name, organization)
            `)
            .eq('player_id', id)
            .order('start_date', { ascending: false });

        if (rosterError) {
            console.error('Roster history error:', rosterError);
            // Don't fail the request if roster fetch fails
            player.roster_history = [];
        } else {
            // Add roster history to player object
            player.roster_history = rosterHistory.map(entry => ({
                team_id: entry.team_id,
                team_name: entry.teams?.name,
                team_organization: entry.teams?.organization,
                start_date: entry.start_date,
                end_date: entry.end_date,
                jersey_number: entry.jersey_number,
                position: entry.position,
                is_active: !entry.end_date
            }));

            // Add current team info for convenience
            const currentTeam = player.roster_history.find(r => r.is_active);
            if (currentTeam) {
                player.current_team = {
                    id: currentTeam.team_id,
                    name: currentTeam.team_name,
                    organization: currentTeam.team_organization
                };
            }
        }

        res.json(player);
    } catch (error) {
        console.error('Get player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/players/{id} - Update player
app.put('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        organization,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        medical_alerts,
        address
    } = req.body;

    try {
        // First check if player exists and get current data
        const { data: existingPlayer, error: fetchError } = await supabase
            .from('players')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch player' });
        }

        // Build update object with only provided fields
        const updates = {};
        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
        if (gender !== undefined) updates.gender = gender;
        if (organization !== undefined) updates.organization = organization;
        if (address !== undefined) updates.address = address;
        if (emergency_contact_name !== undefined) updates.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_phone !== undefined) updates.emergency_contact_phone = emergency_contact_phone;
        if (emergency_contact_relation !== undefined) updates.emergency_contact_relation = emergency_contact_relation;
        if (medical_alerts !== undefined) updates.medical_alerts = medical_alerts;

        // Validate required fields if provided
        if (updates.first_name && !updates.first_name.trim()) {
            return res.status(400).json({ error: 'first_name cannot be empty' });
        }
        if (updates.last_name && !updates.last_name.trim()) {
            return res.status(400).json({ error: 'last_name cannot be empty' });
        }
        if (updates.organization && !updates.organization.trim()) {
            return res.status(400).json({ error: 'organization cannot be empty' });
        }

        // Email validation
        if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Gender validation
        if (updates.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(updates.gender)) {
            return res.status(400).json({ error: 'Invalid gender value' });
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        const { data, error } = await supabase
            .from('players')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            return res.status(500).json({ error: 'Failed to update player' });
        }

        res.json({
            message: 'Player updated successfully',
            player: data
        });
    } catch (error) {
        console.error('Update player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/players/{id} - Delete player
app.delete('/api/players/:id', async (req, res) => {
    const { id } = req.params;

    try {

        // First, delete all roster entries for this player
        const { error: rosterDeleteError } = await supabase
            .from('roster_entries')
            .delete()
            .eq('player_id', id);

        if (rosterDeleteError) {
            console.error('Error deleting roster entries:', rosterDeleteError);
            return res.status(500).json({ error: 'Failed to remove player from teams' });
        }

        // Then delete the player
        const { data, error } = await supabase
            .from('players')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            return res.status(500).json({ error: 'Failed to delete player' });
        }

        res.json({
            message: 'Player deleted successfully'
        });
    } catch (error) {
        console.error('Delete player error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/teams/{id} - Update team
app.put('/api/teams/:id', async (req, res) => {
    const { id } = req.params;
    const { name, organization, division, age_group, skill_level } = req.body;

    if (!name || !organization) {
        return res.status(400).json({ error: 'Name and organization are required' });
    }

    try {
        const { data, error } = await supabase
            .from('teams')
            .update({ name, organization, division, age_group, skill_level })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            return res.status(500).json({ error: 'Failed to update team' });
        }

        res.json({
            message: 'Team updated successfully',
            team: data
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/teams/{id} - Delete team
app.delete('/api/teams/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // First, delete all associated roster entries
        const { error: rosterDeleteError } = await supabase
            .from('roster_entries')
            .delete()
            .eq('team_id', id);

        if (rosterDeleteError) {
            console.error('Error deleting roster entries:', rosterDeleteError);
            return res.status(500).json({ error: 'Failed to delete team roster entries' });
        }

        // Then delete the team
        const { data, error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            return res.status(500).json({ error: 'Failed to delete team' });
        }

        res.json({
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Roster management endpoints
// POST /api/teams/{team_id}/roster - Add player to team roster
app.post('/api/teams/:team_id/roster', async (req, res) => {
    const { team_id } = req.params;
    const { player_id, start_date, jersey_number, position } = req.body;

    if (!player_id || !start_date) {
        return res.status(400).json({ error: 'player_id and start_date are required' });
    }

    // Validate start date is not in the past
    const startDate = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
    }

    // Validate position is not empty
    if (position !== undefined && position !== null && position.trim() === '') {
        return res.status(400).json({ error: 'Position cannot be empty' });
    }

    try {
        // Check if jersey number is unique within the team
        if (jersey_number) {
            const { data: existingJersey, error: jerseyCheckError } = await supabase
                .from('roster_entries')
                .select('id')
                .eq('team_id', team_id)
                .eq('jersey_number', jersey_number)
                .or('end_date.is.null,end_date.gt.now()')
                .single();

            if (!jerseyCheckError || existingJersey) {
                return res.status(409).json({ error: `Jersey number ${jersey_number} is already taken in this team` });
            }
        }

        const { data, error } = await supabase
            .from('roster_entries')
            .insert([{
                team_id: parseInt(team_id),
                player_id,
                start_date,
                jersey_number: jersey_number || null,
                position: position || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'Player already on roster for this start date' });
            }
            return res.status(500).json({ error: 'Failed to add player to roster' });
        }

        res.status(201).json({
            message: 'Player added to roster successfully',
            roster_entry_id: data.id
        });
    } catch (error) {
        console.error('Add to roster error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Legacy endpoint - kept for backwards compatibility
app.post('/api/roster', async (req, res) => {
    const { team_id, player_id, start_date, jersey_number, position } = req.body;

    if (!team_id || !player_id || !start_date) {
        return res.status(400).json({ error: 'team_id, player_id, and start_date are required' });
    }

    try {
        const { data, error } = await supabase
            .from('roster_entries')
            .insert([{
                team_id,
                player_id,
                start_date,
                jersey_number: jersey_number || null,
                position: position || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'Player already on roster for this start date' });
            }
            return res.status(500).json({ error: 'Failed to add player to roster' });
        }

        res.status(201).json({
            message: 'Player added to roster successfully',
            roster_entry_id: data.id
        });
    } catch (error) {
        console.error('Add to roster error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/roster/{team_id} - Get team roster
app.get('/api/roster/:team_id', async (req, res) => {
    const { team_id } = req.params;

    try {
        // Get team details
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', team_id)
            .single();

        if (teamError) {
            if (teamError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Team not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Get roster entries with player details
        const { data: roster, error: rosterError } = await supabase
            .from('roster_entries')
            .select(`
                *,
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth
                )
            `)
            .eq('team_id', team_id)
            .or('end_date.is.null,end_date.gt.now()')
            .order('jersey_number', { ascending: true });

        if (rosterError) {
            console.error('Supabase error:', rosterError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Flatten the response
        const formattedRoster = roster.map(entry => ({
            ...entry.players,
            roster_entry_id: entry.id,
            jersey_number: entry.jersey_number,
            position: entry.position,
            start_date: entry.start_date,
            end_date: entry.end_date
        }));

        res.json({
            team: team,
            roster: formattedRoster
        });
    } catch (error) {
        console.error('Get roster error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/roster/{roster_entry_id} - Update roster entry
app.put('/api/roster/:roster_entry_id', async (req, res) => {
    const { roster_entry_id } = req.params;
    const { jersey_number, position, end_date } = req.body;

    try {
        const { data, error } = await supabase
            .from('roster_entries')
            .update({
                jersey_number: jersey_number || null,
                position: position || null,
                end_date: end_date || null
            })
            .eq('id', roster_entry_id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roster entry not found' });
            }
            return res.status(500).json({ error: 'Failed to update roster entry' });
        }

        res.json({
            message: 'Roster entry updated successfully',
            roster_entry: data
        });
    } catch (error) {
        console.error('Update roster error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/roster/{roster_entry_id} - Remove from roster
app.delete('/api/roster/:roster_entry_id', async (req, res) => {
    const { roster_entry_id } = req.params;

    try {
        const { error } = await supabase
            .from('roster_entries')
            .delete()
            .eq('id', roster_entry_id);

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roster entry not found' });
            }
            return res.status(500).json({ error: 'Failed to remove from roster' });
        }

        res.json({
            message: 'Player removed from roster successfully'
        });
    } catch (error) {
        console.error('Remove from roster error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Division Management Endpoints
// POST /api/structure/divisions - Create division
app.post('/api/structure/divisions', async (req, res) => {
    const { name, description } = req.body;

    // TODO: Add proper authentication/authorization check here
    // For now, we'll proceed without auth check

    if (!name) {
        return res.status(400).json({ error: 'Division name is required' });
    }

    try {
        // Check if division name already exists
        const { data: existingDivision, error: checkError } = await supabase
            .from('divisions')
            .select('id')
            .eq('name', name)
            .single();

        if (existingDivision) {
            return res.status(409).json({ error: 'Division name already exists' });
        }

        // Create the division
        const { data, error } = await supabase
            .from('divisions')
            .insert([{
                name,
                description: description || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create division' });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Create division error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/divisions - List all divisions
app.get('/api/structure/divisions', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        const { data, error, count } = await supabase
            .from('divisions')
            .select('*', { count: 'exact' })
            .order('name', { ascending: true })
            .range(from, to);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            divisions: data,
            pagination: {
                page: page,
                limit: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('List divisions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/divisions/{division_id} - Get specific division
app.get('/api/structure/divisions/:division_id', async (req, res) => {
    const { division_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('divisions')
            .select('*')
            .eq('id', division_id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Division not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get division error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/structure/divisions/{division_id} - Update division
app.put('/api/structure/divisions/:division_id', async (req, res) => {
    const { division_id } = req.params;
    const { name, description } = req.body;

    // TODO: Add proper authentication/authorization check here

    const updates = {};
    if (name !== undefined) {
        // Check if new name already exists (excluding current division)
        const { data: existingDivision } = await supabase
            .from('divisions')
            .select('id')
            .eq('name', name)
            .neq('id', division_id)
            .single();

        if (existingDivision) {
            return res.status(409).json({ error: 'Division name already exists' });
        }
        updates.name = name;
    }
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    try {
        const { data, error } = await supabase
            .from('divisions')
            .update(updates)
            .eq('id', division_id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Division not found' });
            }
            return res.status(500).json({ error: 'Failed to update division' });
        }

        res.json(data);
    } catch (error) {
        console.error('Update division error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/structure/divisions/{division_id} - Delete division
app.delete('/api/structure/divisions/:division_id', async (req, res) => {
    const { division_id } = req.params;

    // TODO: Add proper authentication/authorization check here

    try {
        // Check if any teams are using this division
        const { data: teams, error: checkError } = await supabase
            .from('teams')
            .select('id')
            .eq('division_id', division_id)
            .limit(1);

        if (checkError) {
            console.error('Supabase error:', checkError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (teams && teams.length > 0) {
            return res.status(409).json({ error: 'Cannot delete division that is assigned to teams' });
        }

        // Delete the division
        const { error } = await supabase
            .from('divisions')
            .delete()
            .eq('id', division_id);

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Division not found' });
            }
            return res.status(500).json({ error: 'Failed to delete division' });
        }

        res.status(200).json({ message: 'Division deleted successfully' });
    } catch (error) {
        console.error('Delete division error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Skill Level Management Endpoints
// POST /api/structure/skill-levels - Create skill level
app.post('/api/structure/skill-levels', async (req, res) => {
    const { name, description, level } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Skill level name is required' });
    }

    try {
        // Check if skill level with same name already exists
        const { data: existing, error: checkError } = await supabase
            .from('skill_levels')
            .select('id')
            .ilike('name', name.trim())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'A skill level with this name already exists' });
        }

        // Create new skill level
        const { data, error } = await supabase
            .from('skill_levels')
            .insert([{
                name: name.trim(),
                description: description?.trim() || null,
                level: level || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create skill level' });
        }

        res.status(201).json({
            message: 'Skill level created successfully',
            skill_level: data
        });
    } catch (error) {
        console.error('Create skill level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/skill-levels - List all skill levels
app.get('/api/structure/skill-levels', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query = supabase
            .from('skill_levels')
            .select('*', { count: 'exact' });

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Add pagination and ordering
        query = query
            .order('level', { ascending: true, nullsLast: true })
            .order('name', { ascending: true })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            skill_levels: data,
            pagination: {
                page: page,
                limit: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get skill levels error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/skill-levels/{id} - Get single skill level
app.get('/api/structure/skill-levels/:skill_level_id', async (req, res) => {
    const { skill_level_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('skill_levels')
            .select('*')
            .eq('id', skill_level_id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Skill level not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get skill level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/structure/skill-levels/{id} - Update skill level
app.put('/api/structure/skill-levels/:skill_level_id', async (req, res) => {
    const { skill_level_id } = req.params;
    const { name, description, level } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({ error: 'Skill level name cannot be empty' });
        }
        updateData.name = name.trim();
    }
    if (description !== undefined) {
        updateData.description = description?.trim() || null;
    }
    if (level !== undefined) {
        updateData.level = level;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    try {
        // If updating name, check if it already exists
        if (updateData.name) {
            const { data: existing, error: checkError } = await supabase
                .from('skill_levels')
                .select('id')
                .ilike('name', updateData.name)
                .neq('id', skill_level_id)
                .single();

            if (existing) {
                return res.status(409).json({ error: 'A skill level with this name already exists' });
            }
        }

        // Update the skill level
        const { data, error } = await supabase
            .from('skill_levels')
            .update(updateData)
            .eq('id', skill_level_id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Skill level not found' });
            }
            return res.status(500).json({ error: 'Failed to update skill level' });
        }

        res.json({
            message: 'Skill level updated successfully',
            skill_level: data
        });
    } catch (error) {
        console.error('Update skill level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/structure/skill-levels/{id} - Delete skill level
app.delete('/api/structure/skill-levels/:skill_level_id', async (req, res) => {
    const { skill_level_id } = req.params;

    try {
        // Check if skill level is used by any teams
        const { data: teams, error: checkError } = await supabase
            .from('teams')
            .select('id')
            .eq('skill_level', skill_level_id)
            .limit(1);

        if (checkError) {
            console.error('Supabase error:', checkError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (teams && teams.length > 0) {
            return res.status(409).json({ error: 'Cannot delete skill level that is assigned to teams' });
        }

        // Delete the skill level
        const { error } = await supabase
            .from('skill_levels')
            .delete()
            .eq('id', skill_level_id);

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Skill level not found' });
            }
            return res.status(500).json({ error: 'Failed to delete skill level' });
        }

        res.status(200).json({ message: 'Skill level deleted successfully' });
    } catch (error) {
        console.error('Delete skill level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Age Group Management Endpoints
// POST /api/structure/age-groups - Create age group
app.post('/api/structure/age-groups', async (req, res) => {
    const { name, min_age, max_age, description } = req.body;

    // TODO: Add proper authentication/authorization check here
    // For now, we'll proceed without auth check

    if (!name || min_age === undefined || max_age === undefined) {
        return res.status(400).json({ error: 'Name, min_age, and max_age are required' });
    }

    // Validate min_age and max_age are positive integers
    if (!Number.isInteger(min_age) || !Number.isInteger(max_age) || min_age < 0 || max_age < 0) {
        return res.status(400).json({ error: 'min_age and max_age must be positive integers' });
    }

    // Validate min_age is less than max_age
    if (min_age >= max_age) {
        return res.status(400).json({ error: 'min_age must be less than max_age' });
    }

    try {
        // Check if age group name already exists
        const { data: existingAgeGroup, error: checkError } = await supabase
            .from('age_groups')
            .select('id')
            .eq('name', name)
            .single();

        if (existingAgeGroup) {
            return res.status(409).json({ error: 'Age group name already exists' });
        }

        // Create the age group
        const { data, error } = await supabase
            .from('age_groups')
            .insert([{
                name,
                min_age,
                max_age,
                description: description || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create age group' });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Create age group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/age-groups - List all age groups
app.get('/api/structure/age-groups', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        let query = supabase
            .from('age_groups')
            .select('*', { count: 'exact' });

        // Add search filter if provided
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Add pagination and ordering
        query = query
            .order('min_age', { ascending: true })
            .order('name', { ascending: true })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
            age_groups: data,
            pagination: {
                page: page,
                limit: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get age groups error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/structure/age-groups/{age_group_id} - Get specific age group
app.get('/api/structure/age-groups/:age_group_id', async (req, res) => {
    const { age_group_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('age_groups')
            .select('*')
            .eq('id', age_group_id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Age group not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get age group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/structure/age-groups/{age_group_id} - Update age group
app.put('/api/structure/age-groups/:age_group_id', async (req, res) => {
    const { age_group_id } = req.params;
    const { name, min_age, max_age, description } = req.body;

    // TODO: Add proper authentication/authorization check here

    const updates = {};

    if (name !== undefined) {
        if (!name.trim()) {
            return res.status(400).json({ error: 'Age group name cannot be empty' });
        }
        // Check if new name already exists (excluding current age group)
        const { data: existingAgeGroup } = await supabase
            .from('age_groups')
            .select('id')
            .eq('name', name)
            .neq('id', age_group_id)
            .single();

        if (existingAgeGroup) {
            return res.status(409).json({ error: 'Age group name already exists' });
        }
        updates.name = name.trim();
    }

    if (min_age !== undefined) {
        if (!Number.isInteger(min_age) || min_age < 0) {
            return res.status(400).json({ error: 'min_age must be a positive integer' });
        }
        updates.min_age = min_age;
    }

    if (max_age !== undefined) {
        if (!Number.isInteger(max_age) || max_age < 0) {
            return res.status(400).json({ error: 'max_age must be a positive integer' });
        }
        updates.max_age = max_age;
    }

    if (description !== undefined) {
        updates.description = description?.trim() || null;
    }

    // Validate min_age < max_age if both are being updated or exist
    if (updates.min_age !== undefined || updates.max_age !== undefined) {
        // Get current values if not being updated
        if (updates.min_age === undefined || updates.max_age === undefined) {
            const { data: currentAgeGroup } = await supabase
                .from('age_groups')
                .select('min_age, max_age')
                .eq('id', age_group_id)
                .single();

            if (currentAgeGroup) {
                const finalMinAge = updates.min_age !== undefined ? updates.min_age : currentAgeGroup.min_age;
                const finalMaxAge = updates.max_age !== undefined ? updates.max_age : currentAgeGroup.max_age;

                if (finalMinAge >= finalMaxAge) {
                    return res.status(400).json({ error: 'min_age must be less than max_age' });
                }
            }
        } else {
            // Both values are being updated
            if (updates.min_age >= updates.max_age) {
                return res.status(400).json({ error: 'min_age must be less than max_age' });
            }
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    try {
        const { data, error } = await supabase
            .from('age_groups')
            .update(updates)
            .eq('id', age_group_id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Age group not found' });
            }
            return res.status(500).json({ error: 'Failed to update age group' });
        }

        res.json(data);
    } catch (error) {
        console.error('Update age group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/structure/age-groups/{age_group_id} - Delete age group
app.delete('/api/structure/age-groups/:age_group_id', async (req, res) => {
    const { age_group_id } = req.params;

    // TODO: Add proper authentication/authorization check here

    try {
        // Check if any teams are using this age group
        const { data: teams, error: checkError } = await supabase
            .from('teams')
            .select('id')
            .eq('age_group', age_group_id)
            .limit(1);

        if (checkError) {
            console.error('Supabase error:', checkError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (teams && teams.length > 0) {
            return res.status(409).json({ error: 'Cannot delete age group that is assigned to teams' });
        }

        // Delete the age group
        const { error } = await supabase
            .from('age_groups')
            .delete()
            .eq('id', age_group_id);

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Age group not found' });
            }
            return res.status(500).json({ error: 'Failed to delete age group' });
        }

        res.status(200).json({ message: 'Age group deleted successfully' });
    } catch (error) {
        console.error('Delete age group error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/venues - Get all venues
app.get('/api/venues', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch venues' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Fetch venues error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/events - Create new event
app.post('/api/events', async (req, res) => {
    try {
        const {
            title,
            description,
            event_type,
            start_time,
            end_time,
            venue_id,
            team_ids,
            is_recurring,
            recurrence_rule
        } = req.body;

        // Validate required fields
        if (!title || !event_type || !start_time || !end_time || !venue_id || !team_ids || team_ids.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields: title, event_type, start_time, end_time, venue_id, team_ids'
            });
        }

        // Validate event type
        if (!['game', 'practice', 'tournament'].includes(event_type)) {
            return res.status(400).json({
                error: 'Invalid event_type. Must be: game, practice, or tournament'
            });
        }

        // Validate time logic
        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        if (endDate <= startDate) {
            return res.status(400).json({
                error: 'End time must be after start time'
            });
        }

        // Validate recurring event
        if (is_recurring && !recurrence_rule) {
            return res.status(400).json({
                error: 'Recurrence rule is required for recurring events'
            });
        }

        // Insert the event
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .insert([{
                title,
                description: description || null,
                event_type,
                start_time,
                end_time,
                venue_id,
                is_recurring: is_recurring || false,
                recurrence_rule: recurrence_rule || null,
                status: 'scheduled'
            }])
            .select()
            .single();

        if (eventError) {
            console.error('Supabase error:', eventError);
            return res.status(500).json({ error: 'Failed to create event' });
        }

        // Insert team relationships
        const teamRelationships = team_ids.map(teamId => ({
            event_id: eventData.id,
            team_id: parseInt(teamId)
        }));

        const { error: teamError } = await supabase
            .from('event_teams')
            .insert(teamRelationships);

        if (teamError) {
            console.error('Supabase team relationship error:', teamError);
            // Clean up the event if team relationships failed
            await supabase.from('events').delete().eq('id', eventData.id);
            return res.status(500).json({ error: 'Failed to create event team relationships' });
        }

        res.status(201).json({
            message: 'Event created successfully',
            event: { ...eventData, team_ids }
        });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events - Get all events with optional filtering
app.get('/api/events', async (req, res) => {
    try {
        const {
            team_ids,
            venue_id,
            event_type,
            start_date,
            end_date,
            page = 1,
            limit = 50
        } = req.query;

        let query = supabase
            .from('events')
            .select(`
                *,
                venues(name, address),
                event_teams(team_id, teams(id, name))
            `)
            .order('start_time', { ascending: true });

        // Apply filters
        if (team_ids) {
            const teamIdsArray = Array.isArray(team_ids) ? team_ids : [team_ids];
            // Filter events that have any of the specified teams
            query = query.in('event_teams.team_id', teamIdsArray);
        }

        if (venue_id) {
            query = query.eq('venue_id', venue_id);
        }

        if (event_type) {
            query = query.eq('event_type', event_type);
        }

        if (start_date) {
            query = query.gte('start_time', start_date);
        }

        if (end_date) {
            query = query.lte('start_time', end_date);
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error } = await query;

        // Get count separately for pagination
        let countQuery = supabase
            .from('events')
            .select('id', { count: 'exact', head: true });

        if (team_ids) {
            const teamIdsArray = Array.isArray(team_ids) ? team_ids : [team_ids];
            countQuery = countQuery.in('event_teams.team_id', teamIdsArray);
        }

        if (venue_id) {
            countQuery = countQuery.eq('venue_id', venue_id);
        }

        if (event_type) {
            countQuery = countQuery.eq('event_type', event_type);
        }

        if (start_date) {
            countQuery = countQuery.gte('start_time', start_date);
        }

        if (end_date) {
            countQuery = countQuery.lte('start_time', end_date);
        }

        const { count } = await countQuery;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }

        res.json({
            events: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Fetch events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events/{id} - Get single event
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch event' });
        }

        res.json(data);
    } catch (error) {
        console.error('Fetch event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/events/{id} - Update event
app.put('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            event_type,
            start_time,
            end_time,
            venue_id,
            team_ids,
            is_recurring,
            recurrence_rule,
            status
        } = req.body;

        // Validate event type if provided
        if (event_type && !['game', 'practice', 'tournament'].includes(event_type)) {
            return res.status(400).json({
                error: 'Invalid event_type. Must be: game, practice, or tournament'
            });
        }

        // Validate status if provided
        if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be: scheduled, completed, or cancelled'
            });
        }

        // Validate time logic if both times are provided
        if (start_time && end_time) {
            const startDate = new Date(start_time);
            const endDate = new Date(end_time);
            if (endDate <= startDate) {
                return res.status(400).json({
                    error: 'End time must be after start time'
                });
            }
        }

        // Validate recurring event
        if (is_recurring && !recurrence_rule) {
            return res.status(400).json({
                error: 'Recurrence rule is required for recurring events'
            });
        }

        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (event_type !== undefined) updateData.event_type = event_type;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (venue_id !== undefined) updateData.venue_id = venue_id;
        if (team_ids !== undefined) updateData.team_ids = team_ids;
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;
        if (recurrence_rule !== undefined) updateData.recurrence_rule = recurrence_rule;
        if (status !== undefined) updateData.status = status;

        // Update the event
        const { data, error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            return res.status(500).json({ error: 'Failed to update event' });
        }

        res.json({
            message: 'Event updated successfully',
            event: data
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/events/{id} - Delete event
app.delete('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the event
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Event not found' });
            }
            return res.status(500).json({ error: 'Failed to delete event' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication middleware
authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);

        // Verify the JWT token with Supabase
        const { data: user, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user.user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

// Registration Management Endpoints

// POST /api/registrations - Create new registration
app.post('/api/registrations', authenticateUser, async (req, res) => {
    const { user_id, team_id, player_id, registration_fee, notes } = req.body;

    // Validate required fields
    if (!user_id || !team_id || !player_id || !registration_fee) {
        return res.status(400).json({
            error: 'user_id, team_id, player_id, and registration_fee are required'
        });
    }

    // Validate registration fee is positive
    if (registration_fee <= 0) {
        return res.status(400).json({ error: 'Registration fee must be greater than 0' });
    }

    try {
        // Check if registration already exists for this combination
        const { data: existingRegistration, error: checkError } = await supabase
            .from('registrations')
            .select('id')
            .eq('user_id', user_id)
            .eq('team_id', team_id)
            .eq('player_id', player_id)
            .single();

        if (existingRegistration) {
            return res.status(409).json({
                error: 'Registration already exists for this user/team/player combination'
            });
        }

        // Create the registration
        const { data: registration, error } = await supabase
            .from('registrations')
            .insert([{
                user_id,
                team_id,
                player_id,
                registration_fee,
                notes: notes || null
            }])
            .select()
            .single();

        if (error) {
            console.error('Registration creation error:', error);
            return res.status(500).json({ error: 'Failed to create registration' });
        }

        res.status(201).json({
            message: 'Registration created successfully',
            registration
        });
    } catch (error) {
        console.error('Create registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/registrations - List registrations with filtering
app.get('/api/registrations', authenticateUser, async (req, res) => {
    const {
        user_id,
        team_id,
        player_id,
        status,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('registrations')
            .select(`
                *,
                users (
                    id,
                    first_name,
                    last_name,
                    email,
                    organization
                ),
                teams (
                    id,
                    name,
                    organization,
                    division,
                    age_group,
                    skill_level
                ),
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth
                )
            `, { count: 'exact' });

        // Apply filters
        if (user_id) {
            query = query.eq('user_id', user_id);
        }
        if (team_id) {
            query = query.eq('team_id', team_id);
        }
        if (player_id) {
            query = query.eq('player_id', player_id);
        }
        if (status) {
            query = query.eq('status', status);
        }

        // Add pagination and ordering
        query = query
            .order('registration_date', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Registrations fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch registrations' });
        }

        res.json({
            registrations: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/registrations/{registration_id} - Get registration details
app.get('/api/registrations/:registration_id', authenticateUser, async (req, res) => {
    const { registration_id } = req.params;

    try {
        const { data: registration, error } = await supabase
            .from('registrations')
            .select(`
                *,
                users (
                    id,
                    first_name,
                    last_name,
                    email,
                    organization
                ),
                teams (
                    id,
                    name,
                    organization,
                    division,
                    age_group,
                    skill_level
                ),
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth,
                    emergency_contact_name,
                    emergency_contact_phone
                )
            `)
            .eq('id', registration_id)
            .single();

        if (error) {
            console.error('Registration fetch error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch registration' });
        }

        res.json(registration);
    } catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Payment Processing Endpoints

// POST /api/payments/process - Process a new payment
app.post('/api/payments/process', authenticateUser, async (req, res) => {
    const { registration_id, amount, payment_method_details } = req.body;

    // Validate required fields
    if (!registration_id || !amount || !payment_method_details) {
        return res.status(400).json({
            error: 'registration_id, amount, and payment_method_details are required'
        });
    }

    // Validate amount is positive
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate payment method details structure
    if (!payment_method_details.method) {
        return res.status(400).json({
            error: 'payment_method_details must include a method field'
        });
    }

    try {
        // Get registration details
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', registration_id)
            .single();

        if (regError) {
            console.error('Registration fetch error:', regError);
            if (regError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch registration' });
        }

        // Check if payment amount doesn't exceed balance due
        if (amount > registration.balance_due) {
            return res.status(400).json({
                error: 'Payment amount cannot exceed balance due'
            });
        }

        // Create payment record with 'Pending' status
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                registration_id,
                amount,
                payment_method: payment_method_details.method,
                payment_method_details,
                status: 'Pending'
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Payment creation error:', paymentError);
            return res.status(500).json({ error: 'Failed to create payment' });
        }

        // Update registration amount_paid and recalculate balance_due
        const newAmountPaid = parseFloat(registration.amount_paid) + parseFloat(amount);
        const { data: updatedRegistration, error: updateError } = await supabase
            .from('registrations')
            .update({
                amount_paid: newAmountPaid
            })
            .eq('id', registration_id)
            .select()
            .single();

        if (updateError) {
            console.error('Registration update error:', updateError);
            // Rollback payment creation if registration update fails
            await supabase.from('payments').delete().eq('id', payment.id);
            return res.status(500).json({ error: 'Failed to update registration' });
        }

        // Update registration status to 'Complete' when balance_due = 0
        if (updatedRegistration.balance_due === 0) {
            await supabase
                .from('registrations')
                .update({ status: 'Complete' })
                .eq('id', registration_id);
        }

        // Update payment status to 'Completed' (simulating successful processing)
        const { data: completedPayment, error: completeError } = await supabase
            .from('payments')
            .update({
                status: 'Completed',
                processed_at: new Date().toISOString(),
                transaction_id: `txn_${Date.now()}_${payment.id}`
            })
            .eq('id', payment.id)
            .select()
            .single();

        if (completeError) {
            console.error('Payment completion error:', completeError);
            return res.status(500).json({ error: 'Failed to complete payment' });
        }

        res.status(201).json({
            message: 'Payment processed successfully',
            payment: completedPayment
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments - List payments with filtering
app.get('/api/payments', authenticateUser, async (req, res) => {
    const {
        registration_id,
        status,
        method,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('payments')
            .select(`
                *,
                registrations (
                    id,
                    amount_due,
                    amount_paid,
                    balance_due,
                    status,
                    registration_date,
                    users (
                        id,
                        first_name,
                        last_name,
                        email
                    ),
                    teams (
                        id,
                        name,
                        organization
                    ),
                    players (
                        id,
                        first_name,
                        last_name,
                        email
                    )
                )
            `, { count: 'exact' });

        // Apply filters
        if (registration_id) {
            query = query.eq('registration_id', registration_id);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (method) {
            query = query.eq('payment_method', method);
        }

        // Add pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Payments fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        res.json({
            payments: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/{payment_id} - Get payment details
app.get('/api/payments/:payment_id', authenticateUser, async (req, res) => {
    const { payment_id } = req.params;

    try {
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                registrations (
                    id,
                    amount_due,
                    amount_paid,
                    balance_due,
                    status,
                    registration_date,
                    notes,
                    users (
                        id,
                        first_name,
                        last_name,
                        email,
                        organization
                    ),
                    teams (
                        id,
                        name,
                        organization,
                        division,
                        age_group,
                        skill_level
                    ),
                    players (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        date_of_birth
                    )
                )
            `)
            .eq('id', payment_id)
            .single();

        if (error) {
            console.error('Payment fetch error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Payment not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch payment' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TEST ENDPOINTS WITHOUT AUTHENTICATION (FOR TESTING ONLY)

// POST /api/test/payments/process - Test payment processing without auth
app.post('/api/test/payments/process', async (req, res) => {
    const { registration_id, amount, payment_method_details } = req.body;

    // Validate required fields
    if (!registration_id || !amount || !payment_method_details) {
        return res.status(400).json({
            error: 'registration_id, amount, and payment_method_details are required'
        });
    }

    // Validate amount is positive
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate payment method details structure
    if (!payment_method_details.method) {
        return res.status(400).json({
            error: 'payment_method_details must include a method field'
        });
    }

    try {
        // Get registration details
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('id', registration_id)
            .single();

        if (regError) {
            console.error('Registration fetch error:', regError);
            if (regError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch registration' });
        }

        // Check if payment amount doesn't exceed balance due
        if (amount > registration.balance_due) {
            return res.status(400).json({
                error: 'Payment amount cannot exceed balance due'
            });
        }

        // Create payment record with 'Pending' status
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                registration_id,
                amount,
                payment_method: payment_method_details.method,
                payment_method_details,
                status: 'Pending'
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Payment creation error:', paymentError);
            return res.status(500).json({ error: 'Failed to create payment' });
        }

        // Update registration amount_paid and recalculate balance_due
        const newAmountPaid = parseFloat(registration.amount_paid) + parseFloat(amount);
        const { data: updatedRegistration, error: updateError } = await supabase
            .from('registrations')
            .update({
                amount_paid: newAmountPaid
            })
            .eq('id', registration_id)
            .select()
            .single();

        if (updateError) {
            console.error('Registration update error:', updateError);
            // Rollback payment creation if registration update fails
            await supabase.from('payments').delete().eq('id', payment.id);
            return res.status(500).json({ error: 'Failed to update registration' });
        }

        // Update registration status to 'Complete' when balance_due = 0
        if (updatedRegistration.balance_due === 0) {
            await supabase
                .from('registrations')
                .update({ status: 'Complete' })
                .eq('id', registration_id);
        }

        // Update payment status to 'Completed' (simulating successful processing)
        const { data: completedPayment, error: completeError } = await supabase
            .from('payments')
            .update({
                status: 'Completed',
                processed_at: new Date().toISOString(),
                transaction_id: `txn_${Date.now()}_${payment.id}`
            })
            .eq('id', payment.id)
            .select()
            .single();

        if (completeError) {
            console.error('Payment completion error:', completeError);
            return res.status(500).json({ error: 'Failed to complete payment' });
        }

        res.status(201).json({
            message: 'Payment processed successfully',
            payment: completedPayment
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/test/payments - Test payment list without auth
app.get('/api/test/payments', async (req, res) => {
    const {
        registration_id,
        status,
        method,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('payments')
            .select(`
                *,
                registrations (
                    id,
                    amount_due,
                    amount_paid,
                    balance_due,
                    status,
                    registration_date,
                    users (
                        id,
                        first_name,
                        last_name,
                        email
                    ),
                    teams (
                        id,
                        name,
                        organization
                    ),
                    players (
                        id,
                        first_name,
                        last_name,
                        email
                    )
                )
            `, { count: 'exact' });

        // Apply filters
        if (registration_id) {
            query = query.eq('registration_id', registration_id);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (method) {
            query = query.eq('payment_method', method);
        }

        // Add pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Payments fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        res.json({
            payments: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/test/payments/{payment_id} - Test payment details without auth
app.get('/api/test/payments/:payment_id', async (req, res) => {
    const { payment_id } = req.params;

    try {
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                registrations (
                    id,
                    amount_due,
                    amount_paid,
                    balance_due,
                    status,
                    registration_date,
                    notes,
                    users (
                        id,
                        first_name,
                        last_name,
                        email,
                        organization
                    ),
                    teams (
                        id,
                        name,
                        organization,
                        division,
                        age_group,
                        skill_level
                    ),
                    players (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        date_of_birth
                    )
                )
            `)
            .eq('id', payment_id)
            .single();

        if (error) {
            console.error('Payment fetch error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Payment not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch payment' });
        }

        res.json(payment);
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Program Management Endpoints

// POST /api/programs - Create new program
app.post('/api/programs', authenticateUser, async (req, res) => {
    const {
        name,
        description,
        season,
        start_date,
        end_date,
        registration_open_date,
        registration_close_date,
        max_capacity,
        base_fee
    } = req.body;

    // Validate required fields
    if (!name || !start_date || !end_date || !registration_open_date || !registration_close_date || base_fee === undefined) {
        return res.status(400).json({
            error: 'name, start_date, end_date, registration_open_date, registration_close_date, and base_fee are required'
        });
    }

    // Validate base_fee is non-negative
    if (base_fee < 0) {
        return res.status(400).json({ error: 'base_fee must be non-negative' });
    }

    // Validate max_capacity if provided
    if (max_capacity !== undefined && max_capacity !== null && max_capacity <= 0) {
        return res.status(400).json({ error: 'max_capacity must be greater than 0' });
    }

    // Validate date constraints
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regOpenDate = new Date(registration_open_date);
    const regCloseDate = new Date(registration_close_date);

    if (startDate >= endDate) {
        return res.status(400).json({ error: 'start_date must be before end_date' });
    }

    if (regOpenDate >= regCloseDate) {
        return res.status(400).json({ error: 'registration_open_date must be before registration_close_date' });
    }

    if (regCloseDate > startDate) {
        return res.status(400).json({ error: 'registration_close_date must be on or before start_date' });
    }

    try {
        const { data: program, error } = await supabase
            .from('programs')
            .insert([{
                name,
                description: description || null,
                season: season || null,
                start_date,
                end_date,
                registration_open_date,
                registration_close_date,
                max_capacity: max_capacity || null,
                base_fee
            }])
            .select()
            .single();

        if (error) {
            console.error('Program creation error:', error);
            return res.status(500).json({ error: 'Failed to create program' });
        }

        res.status(201).json({
            message: 'Program created successfully',
            program
        });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/programs - List programs with filtering
app.get('/api/programs', authenticateUser, async (req, res) => {
    const {
        season,
        is_active,
        registration_status,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('programs')
            .select('*, registrations(count)', { count: 'exact' });

        // Apply filters
        if (season) {
            query = query.eq('season', season);
        }

        if (is_active !== undefined) {
            query = query.eq('is_active', is_active === 'true');
        }

        // Handle registration_status filter
        const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

        if (registration_status) {
            switch (registration_status) {
                case 'upcoming':
                    query = query.gt('registration_open_date', now);
                    break;
                case 'open':
                    query = query.lte('registration_open_date', now)
                               .gte('registration_close_date', now);
                    break;
                case 'closed':
                    query = query.lt('registration_close_date', now)
                               .gte('start_date', now);
                    break;
                case 'ended':
                    query = query.lt('end_date', now);
                    break;
            }
        }

        // Add pagination and ordering
        query = query
            .order('start_date', { ascending: true })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Programs fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch programs' });
        }

        res.json({
            programs: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                totalPages: Math.ceil((count || 0) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/programs/{program_id} - Get program details
app.get('/api/programs/:program_id', authenticateUser, async (req, res) => {
    const { program_id } = req.params;

    try {
        // Get program with registration count
        const { data: program, error } = await supabase
            .from('programs')
            .select(`
                *,
                registrations(count)
            `)
            .eq('id', program_id)
            .single();

        if (error) {
            console.error('Program fetch error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Program not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch program' });
        }

        // Add computed registration_count field
        const registrationCount = program.registrations?.[0]?.count || 0;
        const { registrations, ...programData } = program;

        res.json({
            ...programData,
            registration_count: registrationCount
        });
    } catch (error) {
        console.error('Get program error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/programs/{program_id} - Update program
app.put('/api/programs/:program_id', authenticateUser, async (req, res) => {
    const { program_id } = req.params;
    const {
        name,
        description,
        season,
        start_date,
        end_date,
        registration_open_date,
        registration_close_date,
        max_capacity,
        base_fee,
        is_active
    } = req.body;

    // Build update object with only provided fields
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (season !== undefined) updates.season = season;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    if (registration_open_date !== undefined) updates.registration_open_date = registration_open_date;
    if (registration_close_date !== undefined) updates.registration_close_date = registration_close_date;
    if (max_capacity !== undefined) updates.max_capacity = max_capacity;
    if (base_fee !== undefined) updates.base_fee = base_fee;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    // Validate constraints for provided fields
    if (updates.base_fee !== undefined && updates.base_fee < 0) {
        return res.status(400).json({ error: 'base_fee must be non-negative' });
    }

    if (updates.max_capacity !== undefined && updates.max_capacity !== null && updates.max_capacity <= 0) {
        return res.status(400).json({ error: 'max_capacity must be greater than 0' });
    }

    // For date validation, we need current values if not all dates are being updated
    try {
        // Get current program for date validation
        const { data: currentProgram, error: fetchError } = await supabase
            .from('programs')
            .select('start_date, end_date, registration_open_date, registration_close_date')
            .eq('id', program_id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Program not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch program' });
        }

        // Use current values for dates not being updated
        const finalStartDate = new Date(updates.start_date || currentProgram.start_date);
        const finalEndDate = new Date(updates.end_date || currentProgram.end_date);
        const finalRegOpenDate = new Date(updates.registration_open_date || currentProgram.registration_open_date);
        const finalRegCloseDate = new Date(updates.registration_close_date || currentProgram.registration_close_date);

        // Validate date constraints
        if (finalStartDate >= finalEndDate) {
            return res.status(400).json({ error: 'start_date must be before end_date' });
        }

        if (finalRegOpenDate >= finalRegCloseDate) {
            return res.status(400).json({ error: 'registration_open_date must be before registration_close_date' });
        }

        if (finalRegCloseDate > finalStartDate) {
            return res.status(400).json({ error: 'registration_close_date must be on or before start_date' });
        }

        // Perform the update
        const { data: updatedProgram, error: updateError } = await supabase
            .from('programs')
            .update(updates)
            .eq('id', program_id)
            .select()
            .single();

        if (updateError) {
            console.error('Program update error:', updateError);
            return res.status(500).json({ error: 'Failed to update program' });
        }

        res.json({
            message: 'Program updated successfully',
            program: updatedProgram
        });
    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/programs/{program_id} - Delete program
app.delete('/api/programs/:program_id', authenticateUser, async (req, res) => {
    const { program_id } = req.params;

    try {
        // Check if program exists and has registrations
        const { data: program, error: fetchError } = await supabase
            .from('programs')
            .select(`
                id,
                name,
                registrations(count)
            `)
            .eq('id', program_id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Program not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch program' });
        }

        const registrationCount = program.registrations?.[0]?.count || 0;

        // Check for existing registrations
        if (registrationCount > 0) {
            return res.status(409).json({
                error: 'Cannot delete program with existing registrations',
                registration_count: registrationCount
            });
        }

        // Delete the program
        const { error: deleteError } = await supabase
            .from('programs')
            .delete()
            .eq('id', program_id);

        if (deleteError) {
            console.error('Program deletion error:', deleteError);
            return res.status(500).json({ error: 'Failed to delete program' });
        }

        res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`GamePlanPro server running on http://localhost:${PORT}`);
});