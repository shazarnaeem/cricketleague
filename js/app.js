// ============================================
// PUBGM WOW Ramadan Cricket Showdown
// Core Data Layer - app.js (Supabase Live Version)
// ============================================

// ⚠️ IMPORTANT: Replace this with your actual Supabase anon/public key (starts with 'eyJ')
// Get it from: Supabase Dashboard → Project Settings → API → anon public
const SUPABASE_URL = 'https://ksudefydfnyuoitrajpw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pATxWESx8IstpJdaVKMOxg_sWNnVI38';

// Default settings fallback (used when DB settings not found)
const DEFAULT_SETTINGS = {
  tournamentName: 'PUBGM WOW Ramadan Cricket Showdown',
  format: 'single_elimination',
  teamsCount: 8,
  oversPerInnings: 5,
  extraBallForWide: true,
  extraBallForNoBall: true,
  pointsWin: 2,
  pointsDraw: 1,
  pointsLoss: 0,
};

let supabase = null;
try {
  // The CDN exposes the library as window.supabase (not supabasejs)
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase initialized.');
  } else {
    console.error('Supabase library (supabase-js) load nahi hui. Check CDN link.');
  }
} catch (err) {
  console.error('Supabase Initialization Error:', err);
}

// Global cached data to avoid redundant fetches within same page session
let _cachedData = {
  settings: null,
  teams: [],
  matches: [],
  results: [],
};

// ============================================
// CORE DATA FETCHING (ASYNC)
// ============================================

async function ensureDataLoaded(force = false) {
  if (force || !_cachedData.settings) {
    await Promise.all([
      fetchSettings(),
      fetchTeams(),
      fetchMatches(),
      fetchResults()
    ]);
  }
}

async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (data) {
    _cachedData.settings = data;
    // Map database fields to app field names if different
    _cachedData.settings.tournamentName = data.tournament_name;
    _cachedData.settings.oversPerInnings = data.overs_per_innings;
    _cachedData.settings.extraBallForWide = data.extra_ball_wide;
    _cachedData.settings.extraBallForNoBall = data.extra_ball_noball;
    _cachedData.settings.pointsWin = data.points_win;
    _cachedData.settings.pointsDraw = data.points_draw;
    _cachedData.settings.pointsLoss = data.points_loss;
  } else {
    _cachedData.settings = { ...DEFAULT_SETTINGS };
  }
  return _cachedData.settings;
}

async function fetchTeams() {
  const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
  _cachedData.teams = data || [];
  return _cachedData.teams;
}

async function fetchMatches() {
  const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: true });
  if (data) {
    _cachedData.matches = data.map(m => ({
      ...m,
      team1Id: m.team1_id,
      team2Id: m.team2_id,
      date: m.match_date,
      time: m.match_time
    }));
  }
  return _cachedData.matches;
}

async function fetchResults() {
  const { data, error } = await supabase.from('results').select('*');
  if (data) {
    _cachedData.results = data.map(r => ({
      ...r,
      matchId: r.match_id,
      team1Id: r.team1_id,
      team2Id: r.team2_id,
      team1Runs: r.team1_runs,
      team1Wickets: r.team1_wickets,
      team1Overs: r.team1_overs,
      team2Runs: r.team2_runs,
      team2Wickets: r.team2_wickets,
      team2Overs: r.team2_overs,
      winnerId: r.winner_id,
      team1PlayerScores: r.team1_player_scores,
      team2PlayerScores: r.team2_player_scores
    }));
  }
  return _cachedData.results;
}

// ============================================
// SETTINGS
// ============================================
async function getSettingsAsync() {
  if (!_cachedData.settings) await fetchSettings();
  return _cachedData.settings;
}

async function saveSettingsAsync(s) {
  const { data, error } = await supabase.from('settings').update({
    tournament_name: s.tournamentName,
    format: s.format,
    teams_count: s.teamsCount,
    overs_per_innings: s.oversPerInnings,
    extra_ball_wide: s.extraBallForWide,
    extra_ball_noball: s.extraBallForNoBall,
    points_win: s.pointsWin,
    points_draw: s.pointsDraw,
    points_loss: s.pointsLoss,
    updated_at: new Date().toISOString()
  }).eq('id', 1);

  if (!error) _cachedData.settings = { ...s };
  return !error;
}

// ============================================
// TEAMS CRUD
// ============================================
async function getTeamsAsync() {
  return await fetchTeams();
}

async function getTeamByIdAsync(id) {
  const teams = await getTeamsAsync();
  return teams.find(t => t.id === id) || null;
}

async function createTeamAsync(teamData) {
  const { data, error } = await supabase.from('teams').insert([{
    name: teamData.name.trim(),
    emoji: teamData.emoji || '🏏',
    color: teamData.color || randomColor(),
    players: teamData.players || []
  }]).select();

  if (data) await fetchTeams();
  return data ? data[0] : null;
}

async function updateTeamAsync(id, updates) {
  const { error } = await supabase.from('teams').update({
    name: updates.name,
    emoji: updates.emoji,
    color: updates.color,
    players: updates.players
  }).eq('id', id);

  if (!error) await fetchTeams();
  return !error;
}

async function deleteTeamAsync(id) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (!error) {
    await Promise.all([fetchTeams(), fetchMatches(), fetchResults()]);
  }
  return !error;
}

// ============================================
// MATCHES CRUD
// ============================================
async function getMatchesAsync() {
  return await fetchMatches();
}

async function getMatchByIdAsync(id) {
  const matches = await getMatchesAsync();
  return matches.find(m => m.id === id) || null;
}

async function createMatchAsync(matchData) {
  const { data, error } = await supabase.from('matches').insert([{
    team1_id: matchData.team1Id,
    team2_id: matchData.team2Id,
    match_date: matchData.date || null,
    match_time: matchData.time || null,
    venue: matchData.venue || '',
    round: matchData.round || 'Round 1',
    status: 'scheduled'
  }]).select();

  if (data) await fetchMatches();
  return data ? data[0] : null;
}

async function updateMatchAsync(id, updates) {
  const { error } = await supabase.from('matches').update({
    team1_id: updates.team1Id,
    team2_id: updates.team2Id,
    match_date: updates.date,
    match_time: updates.time,
    venue: updates.venue,
    round: updates.round
  }).eq('id', id);

  if (!error) await fetchMatches();
  return !error;
}

async function deleteMatchAsync(id) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (!error) await Promise.all([fetchMatches(), fetchResults()]);
  return !error;
}

// ============================================
// RESULTS / SCORES
// ============================================
async function getResultsAsync() {
  return await fetchResults();
}

async function getResultByMatchIdAsync(matchId) {
  const results = await getResultsAsync();
  return results.find(r => r.matchId === matchId) || null;
}

async function saveResultAsync(res) {
  const resultObj = {
    match_id: res.matchId,
    team1_id: res.team1Id,
    team2_id: res.team2Id,
    team1_runs: parseInt(res.team1Runs) || 0,
    team1_wickets: parseInt(res.team1Wickets) || 0,
    team1_overs: parseFloat(res.team1Overs) || 0,
    team2_runs: parseInt(res.team2Runs) || 0,
    team2_wickets: parseInt(res.team2Wickets) || 0,
    team2_overs: parseFloat(res.team2Overs) || 0,
    winner_id: res.winnerId || null,
    is_draw: res.isDraw || false,
    notes: res.notes || '',
    team1_player_scores: res.team1PlayerScores || [],
    team2_player_scores: res.team2PlayerScores || [],
    saved_at: new Date().toISOString()
  };

  // Check if exists
  const { data: existing } = await supabase.from('results').select('match_id').eq('match_id', res.matchId).single();

  let error;
  if (existing) {
    const { error: err } = await supabase.from('results').update(resultObj).eq('match_id', res.matchId);
    error = err;
  } else {
    const { error: err } = await supabase.from('results').insert([resultObj]);
    error = err;
  }

  if (!error) {
    await supabase.from('matches').update({ status: 'completed' }).eq('id', res.matchId);
    await Promise.all([fetchResults(), fetchMatches()]);
  }
  return !error;
}

// ============================================
// TEAMS CRUD
// ============================================
async function getTeamsAsync() {
  return await fetchTeams();
}

async function getTeamByIdAsync(id) {
  const teams = await getTeamsAsync();
  return teams.find(t => t.id === id) || null;
}

async function createTeamAsync(teamData) {
  const { data, error } = await supabase.from('teams').insert([{
    name: teamData.name.trim(),
    emoji: teamData.emoji || '🏏',
    color: teamData.color || randomColor(),
    players: teamData.players || []
  }]).select();

  if (data) await fetchTeams();
  return data ? data[0] : null;
}

async function updateTeamAsync(id, updates) {
  const { error } = await supabase.from('teams').update({
    name: updates.name,
    emoji: updates.emoji,
    color: updates.color,
    players: updates.players
  }).eq('id', id);

  if (!error) await fetchTeams();
  return !error;
}

async function deleteTeamAsync(id) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (!error) {
    await Promise.all([fetchTeams(), fetchMatches(), fetchResults()]);
  }
  return !error;
}

// ============================================
// MATCHES CRUD
// ============================================
async function getMatchesAsync() {
  return await fetchMatches();
}

async function getMatchByIdAsync(id) {
  const matches = await getMatchesAsync();
  return matches.find(m => m.id === id) || null;
}

async function createMatchAsync(matchData) {
  const { data, error } = await supabase.from('matches').insert([{
    team1_id: matchData.team1Id,
    team2_id: matchData.team2Id,
    match_date: matchData.date || null,
    match_time: matchData.time || null,
    venue: matchData.venue || '',
    round: matchData.round || 'Round 1',
    status: 'scheduled'
  }]).select();

  if (data) await fetchMatches();
  return data ? data[0] : null;
}

async function updateMatchAsync(id, updates) {
  const { error } = await supabase.from('matches').update({
    team1_id: updates.team1Id,
    team2_id: updates.team2Id,
    match_date: updates.date,
    match_time: updates.time,
    venue: updates.venue,
    round: updates.round
  }).eq('id', id);

  if (!error) await fetchMatches();
  return !error;
}

async function deleteMatchAsync(id) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (!error) await Promise.all([fetchMatches(), fetchResults()]);
  return !error;
}

// ============================================
// RESULTS / SCORES
// ============================================
async function getResultsAsync() {
  return await fetchResults();
}

async function getResultByMatchIdAsync(matchId) {
  const results = await getResultsAsync();
  return results.find(r => r.matchId === matchId) || null;
}

async function saveResultAsync(res) {
  const resultObj = {
    match_id: res.matchId,
    team1_id: res.team1Id,
    team2_id: res.team2Id,
    team1_runs: parseInt(res.team1Runs) || 0,
    team1_wickets: parseInt(res.team1Wickets) || 0,
    team1_overs: parseFloat(res.team1Overs) || 0,
    team2_runs: parseInt(res.team2Runs) || 0,
    team2_wickets: parseInt(res.team2Wickets) || 0,
    team2_overs: parseFloat(res.team2Overs) || 0,
    winner_id: res.winnerId || null,
    is_draw: res.isDraw || false,
    notes: res.notes || '',
    team1_player_scores: res.team1PlayerScores || [],
    team2_player_scores: res.team2PlayerScores || [],
    saved_at: new Date().toISOString()
  };

  // Check if exists
  const { data: existing } = await supabase.from('results').select('match_id').eq('match_id', res.matchId).single();

  let error;
  if (existing) {
    const { error: err } = await supabase.from('results').update(resultObj).eq('match_id', res.matchId);
    error = err;
  } else {
    const { error: err } = await supabase.from('results').insert([resultObj]);
    error = err;
  }

  if (!error) {
    await supabase.from('matches').update({ status: 'completed' }).eq('id', res.matchId);
    await Promise.all([fetchResults(), fetchMatches()]);
  }
  return !error;
}

// ============================================
// CALCULATIONS (STILL SYNC BUT USE CACHE)
// ============================================

function calculateStandings(teams, results, settings) {
  const standings = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    teamEmoji: team.emoji,
    teamColor: team.color,
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    points: 0,
    runsScored: 0,
    runsConceded: 0,
    oversPlayed: 0,
    oversBowled: 0,
    nrr: 0,
  }));

  results.forEach(result => {
    const t1 = standings.find(s => s.teamId === result.team1Id);
    const t2 = standings.find(s => s.teamId === result.team2Id);
    if (!t1 || !t2) return;

    t1.played++;
    t2.played++;

    t1.runsScored += result.team1Runs;
    t1.runsConceded += result.team2Runs;
    t2.runsScored += result.team2Runs;
    t2.runsConceded += result.team1Runs;

    t1.oversPlayed += result.team1Overs;
    t1.oversBowled += result.team2Overs;
    t2.oversPlayed += result.team2Overs;
    t2.oversBowled += result.team1Overs;

    if (result.isDraw) {
      t1.drawn++;
      t2.drawn++;
      t1.points += settings.pointsDraw;
      t2.points += settings.pointsDraw;
    } else if (result.winnerId === result.team1Id) {
      t1.won++;
      t2.lost++;
      t1.points += settings.pointsWin;
      t2.points += settings.pointsLoss;
    } else if (result.winnerId === result.team2Id) {
      t2.won++;
      t1.lost++;
      t2.points += settings.pointsWin;
      t1.points += settings.pointsLoss;
    }
  });

  standings.forEach(s => {
    const rpo = s.oversPlayed > 0 ? s.runsScored / s.oversPlayed : 0;
    const rpoConceded = s.oversBowled > 0 ? s.runsConceded / s.oversBowled : 0;
    s.nrr = (rpo - rpoConceded).toFixed(3);
  });

  standings.sort((a, b) => b.points - a.points || parseFloat(b.nrr) - parseFloat(a.nrr));
  return standings;
}

async function getStandingsAsync() {
  await ensureDataLoaded();
  return calculateStandings(_cachedData.teams, _cachedData.results, _cachedData.settings);
}

async function getPlayerStatsAsync() {
  await ensureDataLoaded();
  const players = [];

  _cachedData.teams.forEach(team => {
    (team.players || []).forEach(player => {
      players.push({
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        teamId: team.id,
        teamName: team.name,
        teamEmoji: team.emoji,
        teamColor: team.color,
        runs: 0,
        wickets: 0,
        matches: 0,
      });
    });
  });

  _cachedData.results.forEach(result => {
    [...(result.team1PlayerScores || []), ...(result.team2PlayerScores || [])].forEach(ps => {
      const player = players.find(p => p.playerId === ps.playerId);
      if (player) {
        player.runs += parseInt(ps.runs) || 0;
        player.wickets += parseInt(ps.wickets) || 0;
        player.matches++;
      }
    });
  });

  return players;
}

async function getDashboardStatsAsync() {
  await ensureDataLoaded();
  const standings = calculateStandings(_cachedData.teams, _cachedData.results, _cachedData.settings);

  return {
    totalTeams: _cachedData.teams.length,
    totalMatches: _cachedData.matches.length,
    completedMatches: _cachedData.matches.filter(m => m.status === 'completed').length,
    upcomingMatches: _cachedData.matches.filter(m => m.status === 'scheduled').length,
    standings,
    topTeam: standings[0] || null,
    settings: _cachedData.settings,
    recentResults: _cachedData.results.slice(-5).reverse(),
  };
}

// ============================================
// UTILS & UI
// ============================================

function generateId() {
  return 'idx_' + Math.random().toString(36).substr(2, 9);
}

function randomColor() {
  const colors = ['#00f2ff', '#ffcc00', '#ffd700', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return dateStr; }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toastContainer';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

function initMobileSidebar() {
  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.onclick = () => sidebar.classList.toggle('open');
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) sidebar.classList.remove('open');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileSidebar();
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
});

function confirmAction(m) { return window.confirm(m); }

// ============================================
// RESET DATABASE
// ============================================
async function resetDatabaseAsync() {
  try {
    await Promise.all([
      supabase.from('results').delete().neq('id', -1),
      supabase.from('matches').delete().neq('id', -1),
      supabase.from('teams').delete().neq('id', -1),
    ]);
    _cachedData = { settings: null, teams: [], matches: [], results: [] };
    console.log('Database reset complete.');
    return true;
  } catch (err) {
    console.error('Reset failed:', err);
    return false;
  }
}
