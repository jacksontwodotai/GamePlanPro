const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

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

// Authentication middleware
const authenticateUser = async (req, res, next) => {
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

// Players endpoints
app.post('/api/players', async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        player_email,
        player_phone,
        date_of_birth,
        gender,
        organization,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        medical_alerts,
        address,
        parent_guardian_name,
        parent_guardian_email,
        parent_guardian_phone,
        equipment_notes
    } = req.body;

    if (!first_name || !last_name || !organization) {
        return res.status(400).json({ error: 'first_name, last_name, and organization are required' });
    }

    // Email validation for legacy email field
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Email validation for new player_email field
    if (player_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(player_email)) {
        return res.status(400).json({ error: 'Invalid player email format' });
    }

    // Parent/Guardian email validation
    if (parent_guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parent_guardian_email)) {
        return res.status(400).json({ error: 'Invalid parent/guardian email format' });
    }

    // Phone validation for legacy phone field
    if (phone && !/^[+]?[\d\s()-.]{10,}$/.test(phone)) {
        return res.status(400).json({ error: 'Invalid phone format' });
    }

    // Phone validation for new player_phone field
    if (player_phone && !/^[+]?[\d\s()-.]{10,}$/.test(player_phone)) {
        return res.status(400).json({ error: 'Invalid player phone format' });
    }

    // Parent/Guardian phone validation
    if (parent_guardian_phone && !/^[+]?[\d\s()-.]{10,}$/.test(parent_guardian_phone)) {
        return res.status(400).json({ error: 'Invalid parent/guardian phone format' });
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
                player_email,
                player_phone,
                date_of_birth,
                gender,
                organization,
                emergency_contact_name,
                emergency_contact_phone,
                emergency_contact_relation,
                medical_alerts,
                address,
                parent_guardian_name,
                parent_guardian_email,
                parent_guardian_phone,
                equipment_notes
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
        player_email,
        player_phone,
        date_of_birth,
        gender,
        organization,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        medical_alerts,
        address,
        parent_guardian_name,
        parent_guardian_email,
        parent_guardian_phone,
        equipment_notes
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
        if (player_email !== undefined) updates.player_email = player_email;
        if (player_phone !== undefined) updates.player_phone = player_phone;
        if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
        if (gender !== undefined) updates.gender = gender;
        if (organization !== undefined) updates.organization = organization;
        if (address !== undefined) updates.address = address;
        if (emergency_contact_name !== undefined) updates.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_phone !== undefined) updates.emergency_contact_phone = emergency_contact_phone;
        if (emergency_contact_relation !== undefined) updates.emergency_contact_relation = emergency_contact_relation;
        if (medical_alerts !== undefined) updates.medical_alerts = medical_alerts;
        if (parent_guardian_name !== undefined) updates.parent_guardian_name = parent_guardian_name;
        if (parent_guardian_email !== undefined) updates.parent_guardian_email = parent_guardian_email;
        if (parent_guardian_phone !== undefined) updates.parent_guardian_phone = parent_guardian_phone;
        if (equipment_notes !== undefined) updates.equipment_notes = equipment_notes;

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

        // Email validation for legacy email field
        if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Email validation for new player_email field
        if (updates.player_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.player_email)) {
            return res.status(400).json({ error: 'Invalid player email format' });
        }

        // Parent/Guardian email validation
        if (updates.parent_guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.parent_guardian_email)) {
            return res.status(400).json({ error: 'Invalid parent/guardian email format' });
        }

        // Phone validation for legacy phone field
        if (updates.phone && !/^[+]?[\d\s()-.]{10,}$/.test(updates.phone)) {
            return res.status(400).json({ error: 'Invalid phone format' });
        }

        // Phone validation for new player_phone field
        if (updates.player_phone && !/^[+]?[\d\s()-.]{10,}$/.test(updates.player_phone)) {
            return res.status(400).json({ error: 'Invalid player phone format' });
        }

        // Parent/Guardian phone validation
        if (updates.parent_guardian_phone && !/^[+]?[\d\s()-.]{10,}$/.test(updates.parent_guardian_phone)) {
            return res.status(400).json({ error: 'Invalid parent/guardian phone format' });
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
// POST /api/rosters - Add player to team roster
app.post('/api/rosters', authenticateUser, async (req, res) => {
    const { player_id, team_id, start_date, jersey_number, position } = req.body;

    if (!player_id || !team_id || !start_date) {
        return res.status(400).json({ error: 'player_id, team_id, and start_date are required' });
    }

    try {
        // Validate player and team exist
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('id')
            .eq('id', player_id)
            .single();

        if (playerError) {
            return res.status(400).json({ error: 'Invalid player_id' });
        }

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id')
            .eq('id', team_id)
            .single();

        if (teamError) {
            return res.status(400).json({ error: 'Invalid team_id' });
        }

        // Check if player is already actively rostered on this team for overlapping dates
        const { data: existingRoster, error: rosterCheckError } = await supabase
            .from('roster_entries')
            .select('id, start_date, end_date')
            .eq('player_id', player_id)
            .eq('team_id', team_id)
            .or('end_date.is.null,end_date.gte.' + start_date);

        if (!rosterCheckError && existingRoster && existingRoster.length > 0) {
            // Check for actual date overlaps
            const startDate = new Date(start_date);
            for (const entry of existingRoster) {
                const entryStart = new Date(entry.start_date);
                const entryEnd = entry.end_date ? new Date(entry.end_date) : null;

                if (!entryEnd || startDate <= entryEnd) {
                    return res.status(400).json({ error: 'Player is already actively rostered on this team for overlapping dates' });
                }
            }
        }

        // Check if jersey number is unique within the team (for active players)
        if (jersey_number) {
            const { data: existingJersey, error: jerseyCheckError } = await supabase
                .from('roster_entries')
                .select('id')
                .eq('team_id', team_id)
                .eq('jersey_number', jersey_number)
                .is('end_date', null);

            if (!jerseyCheckError && existingJersey && existingJersey.length > 0) {
                return res.status(400).json({ error: `Jersey number ${jersey_number} is already taken by an active player on this team` });
            }
        }

        const { data, error } = await supabase
            .from('roster_entries')
            .insert([{
                team_id: parseInt(team_id),
                player_id: parseInt(player_id),
                start_date,
                jersey_number: jersey_number || null,
                position: position || null
            }])
            .select(`
                *,
                players (id, first_name, last_name, email),
                teams (id, name, organization)
            `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to create roster entry' });
        }

        res.status(201).json({
            message: 'Player added to roster successfully',
            roster_entry: data
        });
    } catch (error) {
        console.error('Create roster entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/rosters - Get roster entries with filtering and pagination
app.get('/api/rosters', authenticateUser, async (req, res) => {
    const { team_id, player_id, is_active, page = 1, limit = 50 } = req.query;

    try {
        let query = supabase
            .from('roster_entries')
            .select(`
                *,
                players (id, first_name, last_name, email, phone, date_of_birth),
                teams (id, name, organization)
            `, { count: 'exact' });

        // Apply filters
        if (team_id) {
            query = query.eq('team_id', team_id);
        }
        if (player_id) {
            query = query.eq('player_id', player_id);
        }
        if (is_active === 'true') {
            query = query.is('end_date', null);
        } else if (is_active === 'false') {
            query = query.not('end_date', 'is', null);
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        // Order by creation date (most recent first)
        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch roster entries' });
        }

        res.json({
            roster_entries: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get roster entries error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/rosters/{roster_entry_id} - Get specific roster entry
app.get('/api/rosters/:roster_entry_id', authenticateUser, async (req, res) => {
    const { roster_entry_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('roster_entries')
            .select(`
                *,
                players (
                    id, first_name, last_name, email, phone, date_of_birth,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                    medical_alerts, address, gender
                ),
                teams (id, name, organization, division, age_group, skill_level)
            `)
            .eq('id', roster_entry_id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roster entry not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch roster entry' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get roster entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/rosters/{roster_entry_id} - Update roster entry
app.put('/api/rosters/:roster_entry_id', authenticateUser, async (req, res) => {
    const { roster_entry_id } = req.params;
    const { end_date, jersey_number, position } = req.body;

    try {
        // Get current roster entry to validate jersey number changes
        const { data: currentEntry, error: fetchError } = await supabase
            .from('roster_entries')
            .select('team_id, jersey_number')
            .eq('id', roster_entry_id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roster entry not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch roster entry' });
        }

        // If jersey number is being changed, check uniqueness
        if (jersey_number && jersey_number !== currentEntry.jersey_number) {
            const { data: existingJersey, error: jerseyCheckError } = await supabase
                .from('roster_entries')
                .select('id')
                .eq('team_id', currentEntry.team_id)
                .eq('jersey_number', jersey_number)
                .is('end_date', null)
                .neq('id', roster_entry_id);

            if (!jerseyCheckError && existingJersey && existingJersey.length > 0) {
                return res.status(400).json({ error: `Jersey number ${jersey_number} is already taken by another active player on this team` });
            }
        }

        const updates = {};
        if (end_date !== undefined) updates.end_date = end_date;
        if (jersey_number !== undefined) updates.jersey_number = jersey_number;
        if (position !== undefined) updates.position = position;

        const { data, error } = await supabase
            .from('roster_entries')
            .update(updates)
            .eq('id', roster_entry_id)
            .select(`
                *,
                players (id, first_name, last_name, email),
                teams (id, name, organization)
            `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to update roster entry' });
        }

        res.json({
            message: 'Roster entry updated successfully',
            roster_entry: data
        });
    } catch (error) {
        console.error('Update roster entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/rosters/{roster_entry_id} - Remove player from roster
app.delete('/api/rosters/:roster_entry_id', authenticateUser, async (req, res) => {
    const { roster_entry_id } = req.params;

    try {
        // Get the roster entry to check if it's active
        const { data: rosterEntry, error: fetchError } = await supabase
            .from('roster_entries')
            .select('start_date, end_date')
            .eq('id', roster_entry_id)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Roster entry not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch roster entry' });
        }

        const today = new Date().toISOString().split('T')[0];
        const startDate = new Date(rosterEntry.start_date);
        const todayDate = new Date(today);

        // If entry was never active (start date is in the future), physically delete
        if (startDate > todayDate) {
            const { error } = await supabase
                .from('roster_entries')
                .delete()
                .eq('id', roster_entry_id);

            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ error: 'Failed to delete roster entry' });
            }

            res.json({
                message: 'Roster entry deleted successfully'
            });
        } else {
            // Logical deletion: set end_date to today if not already set
            if (!rosterEntry.end_date) {
                const { error } = await supabase
                    .from('roster_entries')
                    .update({ end_date: today })
                    .eq('id', roster_entry_id);

                if (error) {
                    console.error('Supabase error:', error);
                    return res.status(500).json({ error: 'Failed to end roster entry' });
                }

                res.json({
                    message: 'Player removed from roster successfully'
                });
            } else {
                res.json({
                    message: 'Player already removed from roster'
                });
            }
        }
    } catch (error) {
        console.error('Delete roster entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Attendance Tracking Endpoints
// POST /api/attendance - Create attendance record
app.post('/api/attendance', authenticateUser, async (req, res) => {
    const { player_id, team_id, event_date, status, notes } = req.body;

    if (!player_id || !team_id || !event_date || !status) {
        return res.status(400).json({ error: 'player_id, team_id, event_date, and status are required' });
    }

    // Validate status values
    const validStatuses = ['Present', 'Absent', 'Excused'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'status must be one of: Present, Absent, Excused' });
    }

    try {
        // Validate player and team exist
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('id')
            .eq('id', player_id)
            .single();

        if (playerError) {
            return res.status(400).json({ error: 'Invalid player_id' });
        }

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id')
            .eq('id', team_id)
            .single();

        if (teamError) {
            return res.status(400).json({ error: 'Invalid team_id' });
        }

        // Check if player is on team roster for the event date
        const { data: rosterCheck, error: rosterError } = await supabase
            .from('roster_entries')
            .select('id, start_date, end_date')
            .eq('player_id', player_id)
            .eq('team_id', team_id)
            .lte('start_date', event_date)
            .or('end_date.is.null,end_date.gte.' + event_date);

        if (rosterError || !rosterCheck || rosterCheck.length === 0) {
            return res.status(400).json({ error: 'Player is not on team roster for the specified date' });
        }

        const { data, error } = await supabase
            .from('attendance_records')
            .insert([{
                player_id: parseInt(player_id),
                team_id: parseInt(team_id),
                event_date,
                status,
                notes: notes || null
            }])
            .select(`
                *,
                players (id, first_name, last_name, email),
                teams (id, name, organization)
            `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({ error: 'Attendance record already exists for this player, team, and date' });
            }
            return res.status(500).json({ error: 'Failed to create attendance record' });
        }

        res.status(201).json({
            message: 'Attendance record created successfully',
            attendance_record: data
        });
    } catch (error) {
        console.error('Create attendance record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/attendance - Get attendance records with filtering and pagination
app.get('/api/attendance', authenticateUser, async (req, res) => {
    const { team_id, player_id, event_date_start, event_date_end, page = 1, limit = 50 } = req.query;

    try {
        let query = supabase
            .from('attendance_records')
            .select(`
                *,
                players (id, first_name, last_name, email, phone),
                teams (id, name, organization)
            `, { count: 'exact' });

        // Apply filters
        if (team_id) {
            query = query.eq('team_id', team_id);
        }
        if (player_id) {
            query = query.eq('player_id', player_id);
        }
        if (event_date_start) {
            query = query.gte('event_date', event_date_start);
        }
        if (event_date_end) {
            query = query.lte('event_date', event_date_end);
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        // Order by event date (most recent first)
        query = query.order('event_date', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch attendance records' });
        }

        res.json({
            attendance_records: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get attendance records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/attendance/{attendance_record_id} - Get specific attendance record
app.get('/api/attendance/:attendance_record_id', authenticateUser, async (req, res) => {
    const { attendance_record_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('attendance_records')
            .select(`
                *,
                players (
                    id, first_name, last_name, email, phone, date_of_birth,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                    medical_alerts, address, gender
                ),
                teams (id, name, organization, division, age_group, skill_level)
            `)
            .eq('id', attendance_record_id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch attendance record' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get attendance record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/attendance/{attendance_record_id} - Update attendance record
app.put('/api/attendance/:attendance_record_id', authenticateUser, async (req, res) => {
    const { attendance_record_id } = req.params;
    const { status, notes } = req.body;

    try {
        // Validate status if provided
        if (status) {
            const validStatuses = ['Present', 'Absent', 'Excused'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'status must be one of: Present, Absent, Excused' });
            }
        }

        const updates = {};
        if (status !== undefined) updates.status = status;
        if (notes !== undefined) updates.notes = notes;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('attendance_records')
            .update(updates)
            .eq('id', attendance_record_id)
            .select(`
                *,
                players (id, first_name, last_name, email),
                teams (id, name, organization)
            `)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            return res.status(500).json({ error: 'Failed to update attendance record' });
        }

        res.json({
            message: 'Attendance record updated successfully',
            attendance_record: data
        });
    } catch (error) {
        console.error('Update attendance record error:', error);
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


// Registration Management Endpoints

// POST /api/registrations - Create new registration
app.post('/api/registrations', authenticateUser, async (req, res) => {
    const { player_id, program_id, notes } = req.body;

    // Validate required fields
    if (!player_id || !program_id) {
        return res.status(400).json({
            error: 'player_id and program_id are required'
        });
    }

    try {
        // Get program details to validate availability and calculate fees
        const { data: program, error: programError } = await supabase
            .from('programs')
            .select('*')
            .eq('id', program_id)
            .single();

        if (programError) {
            console.error('Program fetch error:', programError);
            if (programError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Program not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch program details' });
        }

        // Validate program is active
        if (!program.is_active) {
            return res.status(400).json({ error: 'Program is not currently active' });
        }

        // Validate registration dates
        const currentDate = new Date();
        const registrationOpenDate = new Date(program.registration_open_date);
        const registrationCloseDate = new Date(program.registration_close_date);

        if (currentDate < registrationOpenDate) {
            return res.status(400).json({
                error: 'Registration has not opened yet',
                registration_open_date: program.registration_open_date
            });
        }

        if (currentDate > registrationCloseDate) {
            return res.status(400).json({
                error: 'Registration deadline has passed',
                registration_close_date: program.registration_close_date
            });
        }

        // Check capacity if max_capacity is set
        if (program.max_capacity) {
            const { count: registrationCount, error: countError } = await supabase
                .from('program_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('program_id', program_id)
                .in('status', ['pending', 'confirmed']);

            if (countError) {
                console.error('Registration count error:', countError);
                return res.status(500).json({ error: 'Failed to check program capacity' });
            }

            if (registrationCount >= program.max_capacity) {
                return res.status(400).json({
                    error: 'Program has reached maximum capacity',
                    max_capacity: program.max_capacity,
                    current_registrations: registrationCount
                });
            }
        }

        // Check if registration already exists for this combination
        const { data: existingRegistration, error: checkError } = await supabase
            .from('program_registrations')
            .select('id')
            .eq('player_id', player_id)
            .eq('program_id', program_id)
            .single();

        if (existingRegistration) {
            return res.status(409).json({
                error: 'Registration already exists for this player/program combination'
            });
        }

        // Calculate total_amount_due from program base_fee
        const total_amount_due = program.base_fee;

        // Create the registration
        const { data: registration, error } = await supabase
            .from('program_registrations')
            .insert([{
                player_id,
                program_id,
                user_id: req.user.id, // Get from authenticated user
                status: 'pending',
                amount_paid: 0,
                notes: notes || null
            }])
            .select(`
                *,
                programs (
                    id,
                    name,
                    description,
                    season,
                    start_date,
                    end_date,
                    base_fee
                ),
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth
                )
            `)
            .single();

        if (error) {
            console.error('Registration creation error:', error);
            return res.status(500).json({ error: 'Failed to create registration' });
        }

        // Add calculated total_amount_due to response
        const registrationWithTotal = {
            ...registration,
            total_amount_due: total_amount_due
        };

        res.status(201).json({
            message: 'Registration created successfully',
            registration: registrationWithTotal
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
        player_id,
        program_id,
        status,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let query = supabase
            .from('program_registrations')
            .select(`
                *,
                users (
                    id,
                    first_name,
                    last_name,
                    email,
                    organization
                ),
                programs (
                    id,
                    name,
                    description,
                    season,
                    start_date,
                    end_date,
                    base_fee,
                    max_capacity
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
        if (player_id) {
            query = query.eq('player_id', player_id);
        }
        if (program_id) {
            query = query.eq('program_id', program_id);
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

        // Add calculated total_amount_due to each registration
        const registrationsWithTotal = (data || []).map(registration => ({
            ...registration,
            total_amount_due: registration.programs?.base_fee || 0
        }));

        res.json({
            registrations: registrationsWithTotal,
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
            .from('program_registrations')
            .select(`
                *,
                users (
                    id,
                    first_name,
                    last_name,
                    email,
                    organization
                ),
                programs (
                    id,
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

        // Add calculated total_amount_due to response
        const registrationWithTotal = {
            ...registration,
            total_amount_due: registration.programs?.base_fee || 0
        };

        res.json(registrationWithTotal);
    } catch (error) {
        console.error('Get registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/registrations/{registration_id} - Update registration
app.put('/api/registrations/:registration_id', authenticateUser, async (req, res) => {
    const { registration_id } = req.params;
    const { status, notes, amount_paid } = req.body;

    // Validate that at least one updateable field is provided
    if (!status && !notes && amount_paid === undefined) {
        return res.status(400).json({
            error: 'At least one field to update is required (status, notes, amount_paid)'
        });
    }

    try {
        // First check if registration exists
        const { data: existingRegistration, error: checkError } = await supabase
            .from('program_registrations')
            .select('id, status, amount_paid')
            .eq('id', registration_id)
            .single();

        if (checkError) {
            console.error('Registration check error:', checkError);
            if (checkError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            return res.status(500).json({ error: 'Failed to check registration' });
        }

        // Validate status if provided
        if (status) {
            const validStatuses = ['pending', 'confirmed', 'waitlisted', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be one of: pending, confirmed, waitlisted, cancelled'
                });
            }
        }

        // Validate amount_paid if provided
        if (amount_paid !== undefined) {
            if (typeof amount_paid !== 'number' || amount_paid < 0) {
                return res.status(400).json({
                    error: 'amount_paid must be a non-negative number'
                });
            }
        }

        // Build update object with only provided fields
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (amount_paid !== undefined) updateData.amount_paid = amount_paid;

        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        // Update the registration
        const { data: updatedRegistration, error } = await supabase
            .from('program_registrations')
            .update(updateData)
            .eq('id', registration_id)
            .select(`
                *,
                users (
                    id,
                    first_name,
                    last_name,
                    email,
                    organization
                ),
                programs (
                    id,
                    name,
                    description,
                    season,
                    start_date,
                    end_date,
                    base_fee
                ),
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth
                )
            `)
            .single();

        if (error) {
            console.error('Registration update error:', error);
            return res.status(500).json({ error: 'Failed to update registration' });
        }

        // Add calculated total_amount_due to response
        const registrationWithTotal = {
            ...updatedRegistration,
            total_amount_due: updatedRegistration.programs?.base_fee || 0
        };

        res.json({
            message: 'Registration updated successfully',
            registration: registrationWithTotal
        });
    } catch (error) {
        console.error('Update registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Registration Flow Endpoints

// POST /api/registration-flow/initiate - Initiate registration process
app.post('/api/registration-flow/initiate', authenticateUser, async (req, res) => {
    const { player_id, program_id } = req.body;

    // Validate required fields
    if (!player_id || !program_id) {
        return res.status(400).json({
            error: 'player_id and program_id are required'
        });
    }

    try {
        // Validate that player exists
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('id, first_name, last_name, email')
            .eq('id', player_id)
            .single();

        if (playerError) {
            console.error('Player fetch error:', playerError);
            if (playerError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Player not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch player details' });
        }

        // Validate that program exists and is active
        const { data: program, error: programError } = await supabase
            .from('programs')
            .select('*')
            .eq('id', program_id)
            .single();

        if (programError) {
            console.error('Program fetch error:', programError);
            if (programError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Program not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch program details' });
        }

        // Validate program is active
        if (!program.is_active) {
            return res.status(400).json({ error: 'Program is not currently active' });
        }

        // Check if registration already exists for this combination
        const { data: existingRegistration, error: checkError } = await supabase
            .from('program_registrations')
            .select('id')
            .eq('player_id', player_id)
            .eq('program_id', program_id)
            .single();

        if (existingRegistration) {
            return res.status(409).json({
                error: 'Registration already exists for this player/program combination',
                registration_id: existingRegistration.id
            });
        }

        // Create new registration with status 'Pending'
        const { data: registration, error: registrationError } = await supabase
            .from('program_registrations')
            .insert([{
                player_id,
                program_id,
                user_id: req.user.id,
                status: 'pending',
                amount_paid: 0,
                notes: null
            }])
            .select('id')
            .single();

        if (registrationError) {
            console.error('Registration creation error:', registrationError);
            return res.status(500).json({ error: 'Failed to create registration' });
        }

        // Retrieve the complete RegistrationForm structure associated with the program
        const { data: registrationForm, error: formError } = await supabase
            .from('registration_forms')
            .select(`
                *,
                form_fields (
                    *,
                    form_field_options (*)
                )
            `)
            .eq('program_id', program_id)
            .eq('is_active', true)
            .single();

        if (formError) {
            console.error('Registration form fetch error:', formError);
            // If no form exists, return registration without form
            return res.status(201).json({
                message: 'Registration initiated successfully',
                registration_id: registration.id,
                registration_form: null,
                warning: 'No active registration form found for this program'
            });
        }

        // Sort form fields by sort_order and options by order_index
        if (registrationForm.form_fields) {
            registrationForm.form_fields.sort((a, b) => a.sort_order - b.sort_order);
            registrationForm.form_fields.forEach(field => {
                if (field.form_field_options) {
                    field.form_field_options.sort((a, b) => a.order_index - b.order_index);
                }
            });
        }

        res.status(201).json({
            message: 'Registration initiated successfully',
            registration_id: registration.id,
            registration_form: registrationForm
        });
    } catch (error) {
        console.error('Registration initiation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stripe Payment Endpoints

// POST /api/payments/create-intent - Create Stripe payment intent
app.post('/api/payments/create-intent', authenticateUser, async (req, res) => {
    const { amount, currency = 'usd', program_registration_id } = req.body;

    // Validate required fields
    if (!amount || !program_registration_id) {
        return res.status(400).json({
            error: 'amount and program_registration_id are required'
        });
    }

    // Validate amount is positive
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    try {
        // Verify the program registration exists and belongs to the user
        const { data: registration, error: regError } = await supabase
            .from('program_registrations')
            .select('id, program_id, player_id, programs(name, base_fee)')
            .eq('id', program_registration_id)
            .single();

        if (regError || !registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                program_registration_id,
                program_name: registration.programs?.name || 'Unknown Program',
                user_id: req.user.id
            }
        });

        res.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });

    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// POST /api/payments/confirm - Confirm payment and record in database
app.post('/api/payments/confirm', authenticateUser, async (req, res) => {
    const { payment_intent_id, program_registration_id } = req.body;

    if (!payment_intent_id || !program_registration_id) {
        return res.status(400).json({
            error: 'payment_intent_id and program_registration_id are required'
        });
    }

    try {
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        // Verify the program registration exists
        const { data: registration, error: regError } = await supabase
            .from('program_registrations')
            .select('id, program_id, player_id')
            .eq('id', program_registration_id)
            .single();

        if (regError || !registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Record payment in database
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                program_registration_id,
                amount: paymentIntent.amount / 100, // Convert back from cents
                payment_method: 'stripe',
                payment_method_details: {
                    payment_intent_id,
                    payment_method: paymentIntent.payment_method,
                    charges: paymentIntent.charges
                },
                status: 'completed',
                transaction_id: payment_intent_id,
                processed_at: new Date().toISOString()
            })
            .select()
            .single();

        if (paymentError) {
            console.error('Payment record error:', paymentError);
            return res.status(500).json({ error: 'Failed to record payment' });
        }

        // Update registration status to confirmed
        const { error: updateError } = await supabase
            .from('program_registrations')
            .update({
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', program_registration_id);

        if (updateError) {
            console.error('Registration update error:', updateError);
        }

        res.json({
            success: true,
            payment,
            message: 'Payment confirmed and registration updated'
        });

    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// Payment Management Endpoints

// POST /api/payments - Record a new payment
app.post('/api/payments', authenticateUser, async (req, res) => {
    const { registration_id, amount, method, transaction_id } = req.body;

    // Validate required fields
    if (!registration_id || !amount || !method) {
        return res.status(400).json({
            error: 'registration_id, amount, and method are required'
        });
    }

    // Validate amount is positive
    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Validate payment method
    const validMethods = ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'online_payment'];
    if (!validMethods.includes(method)) {
        return res.status(400).json({
            error: 'Invalid payment method. Must be one of: ' + validMethods.join(', ')
        });
    }

    try {
        // Get program registration details
        const { data: registration, error: regError } = await supabase
            .from('program_registrations')
            .select(`
                *,
                programs (
                    id,
                    name,
                    base_fee
                )
            `)
            .eq('id', registration_id)
            .single();

        if (regError) {
            console.error('Registration fetch error:', regError);
            if (regError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Registration not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch registration' });
        }

        // Calculate balance due
        const totalAmountDue = registration.programs?.base_fee || 0;
        const currentAmountPaid = parseFloat(registration.amount_paid) || 0;
        const balanceDue = totalAmountDue - currentAmountPaid;

        // Check if payment amount doesn't exceed balance due
        if (amount > balanceDue) {
            return res.status(400).json({
                error: 'Payment amount cannot exceed balance due',
                balance_due: balanceDue,
                amount_requested: amount
            });
        }

        // Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([{
                program_registration_id: registration_id,
                amount,
                payment_method: method,
                transaction_id: transaction_id || null,
                status: 'Completed',
                processed_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (paymentError) {
            console.error('Payment creation error:', paymentError);
            return res.status(500).json({ error: 'Failed to create payment' });
        }

        // Update registration amount_paid
        const newAmountPaid = currentAmountPaid + parseFloat(amount);
        const newBalanceDue = totalAmountDue - newAmountPaid;

        // Determine new status
        let newStatus = registration.status;
        if (newBalanceDue === 0) {
            newStatus = 'confirmed'; // Fully paid registrations are confirmed
        }

        const { data: updatedRegistration, error: updateError } = await supabase
            .from('program_registrations')
            .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', registration_id)
            .select(`
                *,
                programs (
                    id,
                    name,
                    base_fee
                ),
                players (
                    id,
                    first_name,
                    last_name,
                    email
                )
            `)
            .single();

        if (updateError) {
            console.error('Registration update error:', updateError);
            // Rollback payment creation if registration update fails
            await supabase.from('payments').delete().eq('id', payment.id);
            return res.status(500).json({ error: 'Failed to update registration' });
        }

        // Add calculated fields to response
        const paymentWithDetails = {
            ...payment,
            registration: {
                ...updatedRegistration,
                total_amount_due: totalAmountDue,
                balance_due: newBalanceDue
            }
        };

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment: paymentWithDetails
        });
    } catch (error) {
        console.error('Record payment error:', error);
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
                program_registrations (
                    id,
                    amount_paid,
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
                    programs (
                        id,
                        name,
                        description,
                        season,
                        base_fee
                    ),
                    players (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone
                    )
                )
            `, { count: 'exact' });

        // Apply filters
        if (registration_id) {
            query = query.eq('program_registration_id', registration_id);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (method) {
            query = query.eq('payment_method', method);
        }

        // Only get payments for program registrations (not old registrations)
        query = query.not('program_registration_id', 'is', null);

        // Add pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Payments fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch payments' });
        }

        // Add calculated fields to each payment
        const paymentsWithCalculations = (data || []).map(payment => {
            const registration = payment.program_registrations;
            const totalAmountDue = registration?.programs?.base_fee || 0;
            const amountPaid = parseFloat(registration?.amount_paid || 0);
            const balanceDue = totalAmountDue - amountPaid;

            return {
                ...payment,
                program_registrations: registration ? {
                    ...registration,
                    total_amount_due: totalAmountDue,
                    balance_due: balanceDue
                } : null
            };
        });

        res.json({
            payments: paymentsWithCalculations,
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
                program_registrations (
                    id,
                    amount_paid,
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
                    programs (
                        id,
                        name,
                        description,
                        season,
                        start_date,
                        end_date,
                        base_fee,
                        max_capacity
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

        // Check if this is a program registration payment
        if (!payment.program_registration_id) {
            return res.status(404).json({ error: 'Payment not found or not associated with program registration' });
        }

        // Add calculated fields
        const registration = payment.program_registrations;
        const totalAmountDue = registration?.programs?.base_fee || 0;
        const amountPaid = parseFloat(registration?.amount_paid || 0);
        const balanceDue = totalAmountDue - amountPaid;

        const paymentWithCalculations = {
            ...payment,
            program_registrations: registration ? {
                ...registration,
                total_amount_due: totalAmountDue,
                balance_due: balanceDue
            } : null
        };

        res.json(paymentWithCalculations);
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

// Report Endpoints
// GET /api/reports/roster - Generate roster reports with multi-format support
app.get('/api/reports/roster', authenticateUser, async (req, res) => {
    try {
        const { team_id, status = 'all', format = 'json' } = req.query;

        // Validate format parameter
        const validFormats = ['json', 'csv', 'pdf'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({ error: 'Invalid format. Must be one of: json, csv, pdf' });
        }

        // Validate status parameter
        const validStatuses = ['active', 'all'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: active, all' });
        }

        // Parse team_id parameter(s) - can be single or multiple
        let teamIds = [];
        if (team_id) {
            teamIds = Array.isArray(team_id) ? team_id : [team_id];
            // Validate that all team_ids are valid integers
            for (const id of teamIds) {
                if (isNaN(parseInt(id))) {
                    return res.status(400).json({ error: 'Invalid team_id. Must be a valid number' });
                }
            }
        }

        // Build the query
        let query = supabase
            .from('roster_entries')
            .select(`
                id,
                start_date,
                end_date,
                jersey_number,
                position,
                created_at,
                players (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    player_email,
                    player_phone,
                    date_of_birth,
                    position
                ),
                teams (
                    id,
                    name,
                    organization,
                    division,
                    age_group,
                    skill_level
                )
            `);

        // Apply team filtering if specified
        if (teamIds.length > 0) {
            query = query.in('team_id', teamIds.map(id => parseInt(id)));
        }

        // Apply status filtering
        if (status === 'active') {
            const today = new Date().toISOString().split('T')[0];
            query = query.or(`end_date.is.null,end_date.gte.${today}`);
        }

        // Order by team name and player name
        query = query.order('team_id').order('players(last_name)');

        const { data: rosterData, error } = await query;

        if (error) {
            console.error('Roster report query error:', error);
            return res.status(500).json({ error: 'Failed to fetch roster data' });
        }

        // Check if any teams were requested but not found
        if (teamIds.length > 0) {
            const foundTeamIds = [...new Set(rosterData.map(entry => entry.teams?.id).filter(Boolean))];
            const requestedTeamIds = teamIds.map(id => parseInt(id));
            const missingTeamIds = requestedTeamIds.filter(id => !foundTeamIds.includes(id));

            if (missingTeamIds.length > 0) {
                // Check if these teams exist but have no roster entries
                const { data: existingTeams } = await supabase
                    .from('teams')
                    .select('id')
                    .in('id', missingTeamIds);

                const existingTeamIds = existingTeams?.map(t => t.id) || [];
                const nonExistentTeamIds = missingTeamIds.filter(id => !existingTeamIds.includes(id));

                if (nonExistentTeamIds.length > 0) {
                    return res.status(404).json({
                        error: `Teams not found: ${nonExistentTeamIds.join(', ')}`
                    });
                }
            }
        }

        // Format the data for response
        const formattedData = rosterData.map(entry => ({
            roster_entry_id: entry.id,
            player_id: entry.players?.id,
            player_first_name: entry.players?.first_name,
            player_last_name: entry.players?.last_name,
            player_email: entry.players?.email || entry.players?.player_email,
            player_phone: entry.players?.phone || entry.players?.player_phone,
            date_of_birth: entry.players?.date_of_birth,
            team_id: entry.teams?.id,
            team_name: entry.teams?.name,
            team_organization: entry.teams?.organization,
            team_division: entry.teams?.division,
            team_age_group: entry.teams?.age_group,
            team_skill_level: entry.teams?.skill_level,
            jersey_number: entry.jersey_number,
            position: entry.position,
            start_date: entry.start_date,
            end_date: entry.end_date,
            status: entry.end_date && new Date(entry.end_date) < new Date() ? 'inactive' : 'active',
            roster_created_at: entry.created_at
        }));

        // Generate response based on format
        switch (format) {
            case 'json':
                res.json({
                    data: formattedData,
                    metadata: {
                        total_entries: formattedData.length,
                        status_filter: status,
                        team_filter: teamIds.length > 0 ? teamIds : 'all',
                        generated_at: new Date().toISOString()
                    }
                });
                break;

            case 'csv':
                // Generate CSV
                const csvData = formattedData.map(entry => ({
                    'Roster Entry ID': entry.roster_entry_id,
                    'Player ID': entry.player_id,
                    'First Name': entry.player_first_name,
                    'Last Name': entry.player_last_name,
                    'Email': entry.player_email || '',
                    'Phone': entry.player_phone || '',
                    'Date of Birth': entry.date_of_birth || '',
                    'Team ID': entry.team_id,
                    'Team Name': entry.team_name,
                    'Organization': entry.team_organization,
                    'Division': entry.team_division || '',
                    'Age Group': entry.team_age_group || '',
                    'Skill Level': entry.team_skill_level || '',
                    'Jersey Number': entry.jersey_number || '',
                    'Position': entry.position || '',
                    'Start Date': entry.start_date,
                    'End Date': entry.end_date || '',
                    'Status': entry.status,
                    'Created At': entry.roster_created_at
                }));

                // Convert to CSV format
                const csvHeaders = Object.keys(csvData[0] || {});
                const csvRows = csvData.map(row =>
                    csvHeaders.map(header => {
                        const value = row[header] || '';
                        // Escape quotes and wrap in quotes if contains comma or quote
                        return value.toString().includes(',') || value.toString().includes('"')
                            ? `"${value.toString().replace(/"/g, '""')}"`
                            : value;
                    }).join(',')
                );

                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="roster-report.csv"');
                res.send(csvContent);
                break;

            case 'pdf':
                // Generate PDF
                const doc = new PDFDocument();
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="roster-report.pdf"');

                doc.pipe(res);

                // PDF Header
                doc.fontSize(20).text('Roster Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12)
                   .text(`Generated: ${new Date().toLocaleDateString()}`)
                   .text(`Status Filter: ${status}`)
                   .text(`Total Entries: ${formattedData.length}`)
                   .moveDown();

                // Group data by team
                const teamGroups = formattedData.reduce((groups, entry) => {
                    const teamKey = `${entry.team_name} (${entry.team_organization})`;
                    if (!groups[teamKey]) {
                        groups[teamKey] = [];
                    }
                    groups[teamKey].push(entry);
                    return groups;
                }, {});

                // Generate PDF content
                Object.entries(teamGroups).forEach(([teamName, entries]) => {
                    doc.fontSize(16).text(teamName, { underline: true });
                    doc.moveDown(0.5);

                    if (entries[0].team_division) {
                        doc.fontSize(10).text(`Division: ${entries[0].team_division}`);
                    }
                    if (entries[0].team_age_group) {
                        doc.fontSize(10).text(`Age Group: ${entries[0].team_age_group}`);
                    }
                    if (entries[0].team_skill_level) {
                        doc.fontSize(10).text(`Skill Level: ${entries[0].team_skill_level}`);
                    }
                    doc.moveDown();

                    entries.forEach(entry => {
                        doc.fontSize(11)
                           .text(`${entry.player_first_name} ${entry.player_last_name}`, { continued: true })
                           .text(entry.jersey_number ? ` (#${entry.jersey_number})` : '', { continued: true })
                           .text(entry.position ? ` - ${entry.position}` : '');

                        if (entry.player_email) {
                            doc.fontSize(9).text(`  Email: ${entry.player_email}`);
                        }
                        if (entry.player_phone) {
                            doc.fontSize(9).text(`  Phone: ${entry.player_phone}`);
                        }

                        doc.fontSize(9)
                           .text(`  Start Date: ${entry.start_date}`)
                           .text(`  Status: ${entry.status}`);

                        doc.moveDown(0.3);
                    });

                    doc.moveDown();
                });

                doc.end();
                break;

            default:
                return res.status(400).json({ error: 'Invalid format' });
        }

    } catch (error) {
        console.error('Roster report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/player-contact - Generate player contact reports with team filtering
app.get('/api/reports/player-contact', authenticateUser, async (req, res) => {
    try {
        const { team_id, format = 'json' } = req.query;

        // Validate format parameter
        const validFormats = ['json', 'csv'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({ error: 'Invalid format. Must be one of: json, csv' });
        }

        // Parse team_id parameter(s) - can be single or multiple
        let teamIds = [];
        if (team_id) {
            teamIds = Array.isArray(team_id) ? team_id : [team_id];
            // Validate that all team_ids are valid integers
            for (const id of teamIds) {
                if (isNaN(parseInt(id))) {
                    return res.status(400).json({ error: 'Invalid team_id. Must be a valid number' });
                }
            }
        }

        let contactData;

        if (teamIds.length > 0) {
            // Filter by teams - join with roster_entries to get only players on specified teams
            let query = supabase
                .from('roster_entries')
                .select(`
                    players (
                        id,
                        first_name,
                        last_name,
                        player_email,
                        player_phone,
                        parent_guardian_name,
                        parent_guardian_email,
                        parent_guardian_phone
                    ),
                    teams (
                        id,
                        name,
                        organization
                    )
                `)
                .in('team_id', teamIds.map(id => parseInt(id)))
                .not('players', 'is', null); // Ensure player exists

            const { data: rosterData, error } = await query;

            if (error) {
                console.error('Player contact query error:', error);
                return res.status(500).json({ error: 'Failed to fetch player contact data' });
            }

            // Check if any teams were requested but not found
            const foundTeamIds = [...new Set(rosterData.map(entry => entry.teams?.id).filter(Boolean))];
            const requestedTeamIds = teamIds.map(id => parseInt(id));
            const missingTeamIds = requestedTeamIds.filter(id => !foundTeamIds.includes(id));

            if (missingTeamIds.length > 0) {
                // Check if these teams exist but have no roster entries
                const { data: existingTeams } = await supabase
                    .from('teams')
                    .select('id')
                    .in('id', missingTeamIds);

                const existingTeamIds = existingTeams?.map(t => t.id) || [];
                const nonExistentTeamIds = missingTeamIds.filter(id => !existingTeamIds.includes(id));

                if (nonExistentTeamIds.length > 0) {
                    return res.status(404).json({
                        error: `Teams not found: ${nonExistentTeamIds.join(', ')}`
                    });
                }
            }

            // Remove duplicates and format data
            const uniquePlayers = new Map();
            rosterData.forEach(entry => {
                if (entry.players) {
                    const playerId = entry.players.id;
                    if (!uniquePlayers.has(playerId)) {
                        uniquePlayers.set(playerId, {
                            ...entry.players,
                            teams: [entry.teams]
                        });
                    } else {
                        // Add team to existing player
                        const existingPlayer = uniquePlayers.get(playerId);
                        if (!existingPlayer.teams.some(team => team.id === entry.teams.id)) {
                            existingPlayer.teams.push(entry.teams);
                        }
                    }
                }
            });

            contactData = Array.from(uniquePlayers.values());
        } else {
            // No team filtering - get all players
            const { data: playersData, error } = await supabase
                .from('players')
                .select(`
                    id,
                    first_name,
                    last_name,
                    player_email,
                    player_phone,
                    parent_guardian_name,
                    parent_guardian_email,
                    parent_guardian_phone
                `);

            if (error) {
                console.error('Player contact query error:', error);
                return res.status(500).json({ error: 'Failed to fetch player contact data' });
            }

            contactData = playersData.map(player => ({
                ...player,
                teams: [] // No team information when not filtering by teams
            }));
        }

        // Format the data for response
        const formattedData = contactData.map(player => ({
            player_id: player.id,
            first_name: player.first_name,
            last_name: player.last_name,
            player_email: player.player_email || '',
            player_phone: player.player_phone || '',
            parent_guardian_name: player.parent_guardian_name || '',
            parent_guardian_email: player.parent_guardian_email || '',
            parent_guardian_phone: player.parent_guardian_phone || '',
            teams: teamIds.length > 0 ? player.teams.map(team => ({
                id: team.id,
                name: team.name,
                organization: team.organization
            })) : []
        }));

        // Generate response based on format
        switch (format) {
            case 'json':
                res.json({
                    data: formattedData,
                    metadata: {
                        total_contacts: formattedData.length,
                        team_filter: teamIds.length > 0 ? teamIds : 'all',
                        generated_at: new Date().toISOString()
                    }
                });
                break;

            case 'csv':
                // Generate CSV
                const csvData = formattedData.map(player => ({
                    'Player ID': player.player_id,
                    'First Name': player.first_name,
                    'Last Name': player.last_name,
                    'Player Email': player.player_email,
                    'Player Phone': player.player_phone,
                    'Parent/Guardian Name': player.parent_guardian_name,
                    'Parent/Guardian Email': player.parent_guardian_email,
                    'Parent/Guardian Phone': player.parent_guardian_phone,
                    'Teams': teamIds.length > 0 ?
                        player.teams.map(team => `${team.name} (${team.organization})`).join('; ') :
                        'All Teams'
                }));

                // Convert to CSV format
                const csvHeaders = Object.keys(csvData[0] || {});
                const csvRows = csvData.map(row =>
                    csvHeaders.map(header => {
                        const value = row[header] || '';
                        // Escape quotes and wrap in quotes if contains comma or quote
                        return value.toString().includes(',') || value.toString().includes('"')
                            ? `"${value.toString().replace(/"/g, '""')}"`
                            : value;
                    }).join(',')
                );

                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="player-contact-report.csv"');
                res.send(csvContent);
                break;

            default:
                return res.status(400).json({ error: 'Invalid format' });
        }

    } catch (error) {
        console.error('Player contact report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/reports/team-summary - Generate team summary reports with active player counts
app.get('/api/reports/team-summary', authenticateUser, async (req, res) => {
    try {
        const { team_id, format = 'json' } = req.query;

        // Validate format parameter
        const validFormats = ['json', 'csv'];
        if (!validFormats.includes(format)) {
            return res.status(400).json({ error: 'Invalid format. Must be one of: json, csv' });
        }

        // Parse team_id parameter(s) - can be single or multiple
        let teamIds = [];
        if (team_id) {
            teamIds = Array.isArray(team_id) ? team_id : [team_id];
            // Validate that all team_ids are valid integers
            for (const id of teamIds) {
                if (isNaN(parseInt(id))) {
                    return res.status(400).json({ error: 'Invalid team_id. Must be a valid number' });
                }
            }
        }

        // Build the teams query
        let teamsQuery = supabase
            .from('teams')
            .select(`
                id,
                name,
                organization,
                description,
                division,
                age_group,
                skill_level
            `);

        // Apply team filtering if specified
        if (teamIds.length > 0) {
            teamsQuery = teamsQuery.in('id', teamIds.map(id => parseInt(id)));
        }

        const { data: teamsData, error: teamsError } = await teamsQuery;

        if (teamsError) {
            console.error('Team summary query error:', teamsError);
            return res.status(500).json({ error: 'Failed to fetch team data' });
        }

        // Check if any specific teams were requested but not found
        if (teamIds.length > 0) {
            const foundTeamIds = teamsData.map(team => team.id);
            const missingTeamIds = teamIds.map(id => parseInt(id)).filter(id => !foundTeamIds.includes(id));

            if (missingTeamIds.length > 0) {
                return res.status(404).json({
                    error: `Teams not found: ${missingTeamIds.join(', ')}`
                });
            }
        }

        // Get active player counts for all teams
        const today = new Date().toISOString().split('T')[0];
        let rosterQuery = supabase
            .from('roster_entries')
            .select('team_id')
            .or(`end_date.is.null,end_date.gte.${today}`);

        // Apply same team filtering to roster query if specified
        if (teamIds.length > 0) {
            rosterQuery = rosterQuery.in('team_id', teamIds.map(id => parseInt(id)));
        }

        const { data: rosterData, error: rosterError } = await rosterQuery;

        if (rosterError) {
            console.error('Roster count query error:', rosterError);
            return res.status(500).json({ error: 'Failed to fetch roster data' });
        }

        // Count active players per team
        const playerCounts = rosterData.reduce((counts, entry) => {
            counts[entry.team_id] = (counts[entry.team_id] || 0) + 1;
            return counts;
        }, {});

        // Format the team summary data
        const summaryData = teamsData.map(team => ({
            team_id: team.id,
            team_name: team.name,
            organization: team.organization,
            description: team.description || '',
            division: team.division || '',
            age_group: team.age_group || '',
            skill_level: team.skill_level || '',
            active_player_count: playerCounts[team.id] || 0
        }));

        // Sort by team name for consistent output
        summaryData.sort((a, b) => a.team_name.localeCompare(b.team_name));

        // Generate response based on format
        switch (format) {
            case 'json':
                res.json({
                    data: summaryData,
                    metadata: {
                        total_teams: summaryData.length,
                        total_active_players: Object.values(playerCounts).reduce((sum, count) => sum + count, 0),
                        team_filter: teamIds.length > 0 ? teamIds : 'all',
                        generated_at: new Date().toISOString()
                    }
                });
                break;

            case 'csv':
                // Generate CSV
                const csvData = summaryData.map(team => ({
                    'Team ID': team.team_id,
                    'Team Name': team.team_name,
                    'Organization': team.organization,
                    'Description': team.description,
                    'Division': team.division,
                    'Age Group': team.age_group,
                    'Skill Level': team.skill_level,
                    'Active Player Count': team.active_player_count
                }));

                // Convert to CSV format
                const csvHeaders = Object.keys(csvData[0] || {});
                const csvRows = csvData.map(row =>
                    csvHeaders.map(header => {
                        const value = row[header] || '';
                        // Escape quotes and wrap in quotes if contains comma or quote
                        return value.toString().includes(',') || value.toString().includes('"')
                            ? `"${value.toString().replace(/"/g, '""')}"`
                            : value;
                    }).join(',')
                );

                const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="team-summary-report.csv"');
                res.send(csvContent);
                break;

            default:
                return res.status(400).json({ error: 'Invalid format' });
        }

    } catch (error) {
        console.error('Team summary report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Form Builder API Endpoints

// GET /api/form-builder/forms - List all registration forms
app.get('/api/form-builder/forms', authenticateUser, async (req, res) => {
    const { program_id, is_active, page = 1, limit = 20 } = req.query;

    try {
        let query = supabase
            .from('registration_forms')
            .select(`
                *,
                programs (
                    id,
                    name,
                    season
                )
            `, { count: 'exact' });

        // Apply filters
        if (program_id) {
            query = query.eq('program_id', program_id);
        }
        if (is_active !== undefined) {
            query = query.eq('is_active', is_active === 'true');
        }

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        query = query.order('created_at', { ascending: false });

        const { data: forms, error, count } = await query;

        if (error) {
            console.error('Forms fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch forms' });
        }

        res.status(200).json({
            forms: forms || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get forms error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/form-builder/forms/{form_id} - Get specific form with fields
app.get('/api/form-builder/forms/:form_id', authenticateUser, async (req, res) => {
    const { form_id } = req.params;

    try {
        // Get form details
        const { data: form, error: formError } = await supabase
            .from('registration_forms')
            .select(`
                *,
                programs (
                    id,
                    name,
                    season
                )
            `)
            .eq('id', form_id)
            .single();

        if (formError) {
            console.error('Form fetch error:', formError);
            if (formError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Form not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch form' });
        }

        // Get form fields with options
        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select(`
                *,
                form_field_options (
                    id,
                    option_label,
                    option_value,
                    sort_order
                )
            `)
            .eq('form_id', form_id)
            .order('sort_order', { ascending: true });

        if (fieldsError) {
            console.error('Form fields fetch error:', fieldsError);
            return res.status(500).json({ error: 'Failed to fetch form fields' });
        }

        res.status(200).json({
            ...form,
            fields: fields || []
        });
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/form-builder/forms - Create new registration form
app.post('/api/form-builder/forms', authenticateUser, async (req, res) => {
    const { name, description, program_id, is_active = true } = req.body;

    // Validate required fields
    if (!name || name.trim().length < 3 || name.trim().length > 100) {
        return res.status(400).json({
            error: 'Form name is required and must be between 3-100 characters'
        });
    }

    try {
        // Check if form name already exists
        const { data: existingForm, error: checkError } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('name', name.trim())
            .single();

        if (existingForm) {
            return res.status(409).json({
                error: 'A form with this name already exists'
            });
        }

        // Validate program_id uniqueness if provided
        if (program_id) {
            const { data: existingProgramForm, error: programCheckError } = await supabase
                .from('registration_forms')
                .select('id')
                .eq('program_id', program_id)
                .single();

            if (existingProgramForm) {
                return res.status(409).json({
                    error: 'A form already exists for this program'
                });
            }
        }

        // Create the form
        const { data: form, error } = await supabase
            .from('registration_forms')
            .insert([{
                name: name.trim(),
                description: description?.trim() || null,
                program_id: program_id || null,
                is_active
            }])
            .select(`
                *,
                programs (
                    id,
                    name,
                    season
                )
            `)
            .single();

        if (error) {
            console.error('Form creation error:', error);
            return res.status(500).json({ error: 'Failed to create form' });
        }

        res.status(201).json({
            message: 'Form created successfully',
            form: {
                ...form,
                fields: []
            }
        });
    } catch (error) {
        console.error('Create form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/form-builder/forms/{form_id} - Update registration form
app.put('/api/form-builder/forms/:form_id', authenticateUser, async (req, res) => {
    const { form_id } = req.params;
    const { name, description, program_id, is_active, fields } = req.body;

    // Validate form name
    if (!name || name.trim().length < 3 || name.trim().length > 100) {
        return res.status(400).json({
            error: 'Form name is required and must be between 3-100 characters'
        });
    }

    try {
        // Check if form exists
        const { data: existingForm, error: checkError } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('id', form_id)
            .single();

        if (checkError || !existingForm) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Check if name is unique (excluding current form)
        const { data: nameCheck, error: nameError } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('name', name.trim())
            .neq('id', form_id)
            .single();

        if (nameCheck) {
            return res.status(409).json({
                error: 'A form with this name already exists'
            });
        }

        // Update form details
        const { data: updatedForm, error: updateError } = await supabase
            .from('registration_forms')
            .update({
                name: name.trim(),
                description: description?.trim() || null,
                program_id: program_id || null,
                is_active: is_active !== undefined ? is_active : true
            })
            .eq('id', form_id)
            .select(`
                *,
                programs (
                    id,
                    name,
                    season
                )
            `)
            .single();

        if (updateError) {
            console.error('Form update error:', updateError);
            return res.status(500).json({ error: 'Failed to update form' });
        }

        // If fields are provided, update them
        if (fields && Array.isArray(fields)) {
            // Delete existing fields
            await supabase
                .from('form_fields')
                .delete()
                .eq('form_id', form_id);

            // Insert new fields
            if (fields.length > 0) {
                const fieldsToInsert = fields.map((field, index) => ({
                    form_id,
                    field_name: field.field_name,
                    field_label: field.field_label,
                    field_type: field.field_type,
                    is_required: field.is_required || false,
                    placeholder_text: field.placeholder_text || null,
                    help_text: field.help_text || null,
                    validation_rules: field.validation_rules || null,
                    field_options: field.field_options || null,
                    sort_order: index
                }));

                const { error: fieldsError } = await supabase
                    .from('form_fields')
                    .insert(fieldsToInsert);

                if (fieldsError) {
                    console.error('Form fields update error:', fieldsError);
                    return res.status(500).json({ error: 'Failed to update form fields' });
                }
            }
        }

        // Get updated fields
        const { data: updatedFields, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .eq('form_id', form_id)
            .order('sort_order', { ascending: true });

        res.json({
            message: 'Form updated successfully',
            form: {
                ...updatedForm,
                fields: updatedFields || []
            }
        });
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/form-builder/forms/{form_id} - Delete registration form
app.delete('/api/form-builder/forms/:form_id', authenticateUser, async (req, res) => {
    const { form_id } = req.params;

    // Check for high-level administrative authorization
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Insufficient permissions. Admin access required.'
        });
    }

    try {
        // Check if form exists
        const { data: existingForm, error: checkError } = await supabase
            .from('registration_forms')
            .select('id, name')
            .eq('id', form_id)
            .single();

        if (checkError || !existingForm) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Delete the form (fields will be cascade deleted)
        const { error } = await supabase
            .from('registration_forms')
            .delete()
            .eq('id', form_id);

        if (error) {
            console.error('Form deletion error:', error);
            return res.status(500).json({ error: 'Failed to delete form' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Delete form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Form Field Management Endpoints

// Supported field types
const SUPPORTED_FIELD_TYPES = [
    'text', 'email', 'number', 'tel', 'url', 'password',
    'textarea', 'select', 'checkbox', 'radio', 'date',
    'datetime-local', 'time', 'file', 'hidden'
];

// POST /api/form-builder/forms/{form_id}/fields - Create new form field
app.post('/api/form-builder/forms/:form_id/fields', authenticateUser, async (req, res) => {
    const { form_id } = req.params;
    const {
        field_name,
        label,
        field_type,
        is_required = false,
        default_value,
        placeholder,
        order_index,
        validation_regex
    } = req.body;

    // Validate required fields
    if (!field_name || !label || !field_type) {
        return res.status(400).json({
            error: 'field_name, label, and field_type are required'
        });
    }

    // Validate field_type
    if (!SUPPORTED_FIELD_TYPES.includes(field_type)) {
        return res.status(400).json({
            error: `Unsupported field_type. Supported types: ${SUPPORTED_FIELD_TYPES.join(', ')}`
        });
    }

    // Validate field_name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field_name)) {
        return res.status(400).json({
            error: 'field_name must start with a letter and contain only letters, numbers, and underscores'
        });
    }

    try {
        // Check if form exists
        const { data: form, error: formError } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('id', form_id)
            .single();

        if (formError || !form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Check field_name uniqueness within the form
        const { data: existingField, error: checkError } = await supabase
            .from('form_fields')
            .select('id')
            .eq('form_id', form_id)
            .eq('field_name', field_name)
            .single();

        if (existingField) {
            return res.status(409).json({
                error: 'A field with this name already exists in this form'
            });
        }

        // Create the form field
        const { data: field, error } = await supabase
            .from('form_fields')
            .insert([{
                form_id,
                field_name,
                field_label: label,
                field_type,
                is_required,
                default_value: default_value || null,
                placeholder_text: placeholder || null,
                sort_order: order_index || 0,
                validation_rules: validation_regex ? { regex: validation_regex } : null
            }])
            .select(`
                *,
                form_field_options (
                    id,
                    option_label,
                    option_value,
                    sort_order
                )
            `)
            .single();

        if (error) {
            console.error('Field creation error:', error);
            return res.status(500).json({ error: 'Failed to create field' });
        }

        res.status(201).json({
            message: 'Field created successfully',
            field
        });
    } catch (error) {
        console.error('Create field error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/form-builder/forms/{form_id}/fields - Get all fields for a form
app.get('/api/form-builder/forms/:form_id/fields', authenticateUser, async (req, res) => {
    const { form_id } = req.params;

    try {
        // Check if form exists
        const { data: form, error: formError } = await supabase
            .from('registration_forms')
            .select('id')
            .eq('id', form_id)
            .single();

        if (formError || !form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        // Get form fields with options
        const { data: fields, error: fieldsError } = await supabase
            .from('form_fields')
            .select(`
                *,
                form_field_options (
                    id,
                    option_label,
                    option_value,
                    sort_order
                )
            `)
            .eq('form_id', form_id)
            .order('sort_order', { ascending: true });

        if (fieldsError) {
            console.error('Fields fetch error:', fieldsError);
            return res.status(500).json({ error: 'Failed to fetch fields' });
        }

        res.status(200).json({
            fields: fields || []
        });
    } catch (error) {
        console.error('Get fields error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/form-builder/fields/{field_id} - Get specific form field
app.get('/api/form-builder/fields/:field_id', authenticateUser, async (req, res) => {
    const { field_id } = req.params;

    try {
        const { data: field, error } = await supabase
            .from('form_fields')
            .select(`
                *,
                form_field_options (
                    id,
                    option_label,
                    option_value,
                    sort_order
                )
            `)
            .eq('id', field_id)
            .single();

        if (error) {
            console.error('Field fetch error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Field not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch field' });
        }

        res.status(200).json(field);
    } catch (error) {
        console.error('Get field error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/form-builder/fields/{field_id} - Update form field
app.put('/api/form-builder/fields/:field_id', authenticateUser, async (req, res) => {
    const { field_id } = req.params;
    const {
        field_name,
        label,
        field_type,
        is_required,
        default_value,
        placeholder,
        order_index,
        validation_regex
    } = req.body;

    // Validate required fields
    if (!field_name || !label || !field_type) {
        return res.status(400).json({
            error: 'field_name, label, and field_type are required'
        });
    }

    // Validate field_type
    if (!SUPPORTED_FIELD_TYPES.includes(field_type)) {
        return res.status(400).json({
            error: `Unsupported field_type. Supported types: ${SUPPORTED_FIELD_TYPES.join(', ')}`
        });
    }

    // Validate field_name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field_name)) {
        return res.status(400).json({
            error: 'field_name must start with a letter and contain only letters, numbers, and underscores'
        });
    }

    try {
        // Check if field exists and get form_id
        const { data: existingField, error: checkError } = await supabase
            .from('form_fields')
            .select('id, form_id')
            .eq('id', field_id)
            .single();

        if (checkError || !existingField) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Check field_name uniqueness within the form (excluding current field)
        const { data: nameCheck, error: nameError } = await supabase
            .from('form_fields')
            .select('id')
            .eq('form_id', existingField.form_id)
            .eq('field_name', field_name)
            .neq('id', field_id)
            .single();

        if (nameCheck) {
            return res.status(409).json({
                error: 'A field with this name already exists in this form'
            });
        }

        // Update the field
        const { data: field, error: updateError } = await supabase
            .from('form_fields')
            .update({
                field_name,
                field_label: label,
                field_type,
                is_required: is_required !== undefined ? is_required : false,
                default_value: default_value || null,
                placeholder_text: placeholder || null,
                sort_order: order_index !== undefined ? order_index : 0,
                validation_rules: validation_regex ? { regex: validation_regex } : null
            })
            .eq('id', field_id)
            .select(`
                *,
                form_field_options (
                    id,
                    option_label,
                    option_value,
                    sort_order
                )
            `)
            .single();

        if (updateError) {
            console.error('Field update error:', updateError);
            return res.status(500).json({ error: 'Failed to update field' });
        }

        res.status(200).json({
            message: 'Field updated successfully',
            field
        });
    } catch (error) {
        console.error('Update field error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/form-builder/fields/{field_id} - Delete form field
app.delete('/api/form-builder/fields/:field_id', authenticateUser, async (req, res) => {
    const { field_id } = req.params;

    try {
        // Check if field exists
        const { data: existingField, error: checkError } = await supabase
            .from('form_fields')
            .select('id, field_name')
            .eq('id', field_id)
            .single();

        if (checkError || !existingField) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Delete the field (field options will be cascade deleted)
        const { error } = await supabase
            .from('form_fields')
            .delete()
            .eq('id', field_id);

        if (error) {
            console.error('Field deletion error:', error);
            return res.status(500).json({ error: 'Failed to delete field' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Form Field Option Management Endpoints
// Selection-based field types that support options
const SELECTION_FIELD_TYPES = ['select', 'checkbox', 'radio'];

// POST /api/form-builder/fields/{field_id}/options - Create new option for a field
app.post('/api/form-builder/fields/:field_id/options', authenticateUser, async (req, res) => {
    const { field_id } = req.params;
    const { option_label, option_value, sort_order = 0 } = req.body;

    // Validate required fields
    if (!option_label || !option_value) {
        return res.status(400).json({
            error: 'option_label and option_value are required'
        });
    }

    // Validate option_label and option_value are strings
    if (typeof option_label !== 'string' || typeof option_value !== 'string') {
        return res.status(400).json({
            error: 'option_label and option_value must be strings'
        });
    }

    // Validate sort_order is a number
    if (typeof sort_order !== 'number') {
        return res.status(400).json({
            error: 'sort_order must be a number'
        });
    }

    try {
        // Check if field exists and supports options
        const { data: field, error: fieldError } = await supabase
            .from('form_fields')
            .select('id, field_type, field_label')
            .eq('id', field_id)
            .single();

        if (fieldError || !field) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Validate field type supports options
        if (!SELECTION_FIELD_TYPES.includes(field.field_type)) {
            return res.status(400).json({
                error: `Field type '${field.field_type}' does not support options. Supported types: ${SELECTION_FIELD_TYPES.join(', ')}`
            });
        }

        // Check if option_value already exists for this field
        const { data: existingOption, error: checkError } = await supabase
            .from('form_field_options')
            .select('id')
            .eq('field_id', field_id)
            .eq('option_value', option_value)
            .single();

        if (existingOption) {
            return res.status(409).json({
                error: 'An option with this value already exists for this field'
            });
        }

        // Create the option
        const { data: newOption, error } = await supabase
            .from('form_field_options')
            .insert([{
                field_id,
                option_label,
                option_value,
                sort_order
            }])
            .select()
            .single();

        if (error) {
            console.error('Option creation error:', error);
            return res.status(500).json({ error: 'Failed to create option' });
        }

        res.status(201).json({
            message: 'Form field option created successfully',
            option: newOption
        });
    } catch (error) {
        console.error('Create option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/form-builder/fields/{field_id}/options - Get all options for a field
app.get('/api/form-builder/fields/:field_id/options', authenticateUser, async (req, res) => {
    const { field_id } = req.params;

    try {
        // Check if field exists
        const { data: field, error: fieldError } = await supabase
            .from('form_fields')
            .select('id, field_type, field_label')
            .eq('id', field_id)
            .single();

        if (fieldError || !field) {
            return res.status(404).json({ error: 'Field not found' });
        }

        // Get all options for the field, ordered by sort_order
        const { data: options, error } = await supabase
            .from('form_field_options')
            .select('*')
            .eq('field_id', field_id)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Get options error:', error);
            return res.status(500).json({ error: 'Failed to retrieve options' });
        }

        res.status(200).json({
            field: {
                id: field.id,
                field_type: field.field_type,
                field_label: field.field_label
            },
            options: options || []
        });
    } catch (error) {
        console.error('Get options error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/form-builder/options/{option_id} - Update an option
app.put('/api/form-builder/options/:option_id', authenticateUser, async (req, res) => {
    const { option_id } = req.params;
    const { option_label, option_value, sort_order } = req.body;

    // Validate at least one field is provided
    if (!option_label && !option_value && sort_order === undefined) {
        return res.status(400).json({
            error: 'At least one field (option_label, option_value, sort_order) must be provided'
        });
    }

    // Validate field types if provided
    if (option_label && typeof option_label !== 'string') {
        return res.status(400).json({ error: 'option_label must be a string' });
    }
    if (option_value && typeof option_value !== 'string') {
        return res.status(400).json({ error: 'option_value must be a string' });
    }
    if (sort_order !== undefined && typeof sort_order !== 'number') {
        return res.status(400).json({ error: 'sort_order must be a number' });
    }

    try {
        // Check if option exists
        const { data: existingOption, error: checkError } = await supabase
            .from('form_field_options')
            .select('id, field_id, option_value')
            .eq('id', option_id)
            .single();

        if (checkError || !existingOption) {
            return res.status(404).json({ error: 'Option not found' });
        }

        // If option_value is being updated, check for duplicates
        if (option_value && option_value !== existingOption.option_value) {
            const { data: duplicateOption, error: dupCheckError } = await supabase
                .from('form_field_options')
                .select('id')
                .eq('field_id', existingOption.field_id)
                .eq('option_value', option_value)
                .neq('id', option_id)
                .single();

            if (duplicateOption) {
                return res.status(409).json({
                    error: 'An option with this value already exists for this field'
                });
            }
        }

        // Build update object
        const updateData = {};
        if (option_label) updateData.option_label = option_label;
        if (option_value) updateData.option_value = option_value;
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        // Update the option
        const { data: updatedOption, error } = await supabase
            .from('form_field_options')
            .update(updateData)
            .eq('id', option_id)
            .select()
            .single();

        if (error) {
            console.error('Option update error:', error);
            return res.status(500).json({ error: 'Failed to update option' });
        }

        res.status(200).json({
            message: 'Form field option updated successfully',
            option: updatedOption
        });
    } catch (error) {
        console.error('Update option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/form-builder/options/{option_id} - Delete an option
app.delete('/api/form-builder/options/:option_id', authenticateUser, async (req, res) => {
    const { option_id } = req.params;

    try {
        // Check if option exists
        const { data: existingOption, error: checkError } = await supabase
            .from('form_field_options')
            .select('id, option_label')
            .eq('id', option_id)
            .single();

        if (checkError || !existingOption) {
            return res.status(404).json({ error: 'Option not found' });
        }

        // Delete the option
        const { error } = await supabase
            .from('form_field_options')
            .delete()
            .eq('id', option_id);

        if (error) {
            console.error('Option deletion error:', error);
            return res.status(500).json({ error: 'Failed to delete option' });
        }

        res.status(204).send();
    } catch (error) {
        console.error('Delete option error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`GamePlanPro server running on http://localhost:${PORT}`);
});