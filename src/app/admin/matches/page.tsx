'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Calendar, Play } from 'lucide-react';
import Link from 'next/link';

interface Team {
    id: string;
    name: string;
    short_name: string;
}

interface Match {
    id: string;
    team1_id: string;
    team2_id: string;
    status: string;
    match_date: string;
    team1?: Team;
    team2?: Team;
}

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newMatch, setNewMatch] = useState({ team1_id: '', team2_id: '', match_date: '' });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        // Fetch Teams for dropdowns
        const { data: teamsData } = await supabase.from('teams').select('*');
        if (teamsData) setTeams(teamsData);

        // Fetch Matches with team details
        const { data: matchesData } = await supabase
            .from('matches')
            .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)')
            .order('created_at', { ascending: false });

        if (matchesData) setMatches(matchesData);
        setLoading(false);
    }

    async function handleAddMatch(e: React.FormEvent) {
        e.preventDefault();
        if (newMatch.team1_id === newMatch.team2_id) {
            alert('Please select two different teams');
            return;
        }

        const { data, error } = await supabase
            .from('matches')
            .insert([newMatch])
            .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)');

        if (error) {
            alert('Error scheduling match: ' + error.message);
        } else {
            setMatches([...(data || []), ...matches]);
            setIsAdding(false);
            setNewMatch({ team1_id: '', team2_id: '', match_date: '' });
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Matches</h2>
                    <p className="text-emerald-100/40 text-sm">Schedule and manage showdowns</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold/80 transition-all"
                >
                    <Plus size={20} /> Schedule Match
                </button>
            </div>

            {isAdding && (
                <div className="glass p-6 border-gold/30">
                    <form onSubmit={handleAddMatch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Team 1</label>
                            <select
                                required
                                value={newMatch.team1_id}
                                onChange={(e) => setNewMatch({ ...newMatch, team1_id: e.target.value })}
                                className="w-full bg-[#0a0f0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                            >
                                <option value="">Select Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider text-center block">VS</label>
                            <select
                                required
                                value={newMatch.team2_id}
                                onChange={(e) => setNewMatch({ ...newMatch, team2_id: e.target.value })}
                                className="w-full bg-[#0a0f0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                            >
                                <option value="">Select Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Date & Time</label>
                            <input
                                required
                                type="datetime-local"
                                value={newMatch.match_date}
                                onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                                className="w-full bg-[#0a0f0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-gold text-black font-bold py-3 rounded-xl hover:bg-gold/80 transition-all">
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl hover:bg-white/10 transition-all text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <p className="text-emerald-100/20 italic">Loading matches...</p>
                ) : matches.length === 0 ? (
                    <p className="text-emerald-100/20 italic">No matches scheduled yet.</p>
                ) : matches.map((match) => (
                    <div key={match.id} className="glass p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-gold">

                        <div className="flex items-center gap-6 flex-1 w-full justify-between md:justify-start md:w-auto">
                            {/* Team 1 */}
                            <div className="flex items-center gap-4 w-1/3 md:w-auto">
                                <div className="h-12 w-12 glass rounded-full flex items-center justify-center font-black text-xl text-gold">
                                    {match.team1?.short_name[0]}
                                </div>
                                <div className="hidden md:block">
                                    <p className="font-bold text-lg">{match.team1?.name}</p>
                                    <p className="text-xs text-emerald-100/40 uppercase">{match.team1?.short_name}</p>
                                </div>
                            </div>

                            {/* VS */}
                            <div className="flex flex-col items-center">
                                <span className="text-xs bg-emerald-900/50 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold mb-2">
                                    {match.status}
                                </span>
                                <span className="font-black italic text-white/20 select-none">VS</span>
                            </div>

                            {/* Team 2 */}
                            <div className="flex items-center gap-4 w-1/3 md:w-auto justify-end md:justify-start md:flex-row-reverse">
                                <div className="h-12 w-12 glass rounded-full flex items-center justify-center font-black text-xl text-gold">
                                    {match.team2?.short_name[0]}
                                </div>
                                <div className="hidden md:block text-right md:text-left">
                                    <p className="font-bold text-lg">{match.team2?.name}</p>
                                    <p className="text-xs text-emerald-100/40 uppercase">{match.team2?.short_name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t border-white/5 md:border-0 pt-4 md:pt-0">
                            <div className="text-sm text-emerald-100/60 flex items-center gap-2">
                                <Calendar size={16} className="text-gold" />
                                {match.match_date ? new Date(match.match_date).toLocaleString() : 'TBD'}
                            </div>

                            {match.status !== 'completed' && (
                                <Link href={`/admin/matches/${match.id}/score`} className="flex items-center gap-2 px-6 py-3 bg-red-600/20 text-red-500 font-bold rounded-xl hover:bg-red-600/40 transition-all border border-red-500/20">
                                    <Play size={16} className="fill-current" /> Live Score
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
