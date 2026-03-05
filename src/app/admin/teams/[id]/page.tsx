'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Player {
    id: string;
    name: string;
    role: string;
}

interface Team {
    id: string;
    name: string;
    short_name: string;
}

export default function TeamDetailsPage() {
    const params = useParams();
    const teamId = params.id as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ name: '', role: 'Batter' });

    useEffect(() => {
        if (teamId) {
            fetchTeamAndPlayers();
        }
    }, [teamId]);

    async function fetchTeamAndPlayers() {
        setLoading(true);

        // Fetch Team
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();

        if (teamData) setTeam(teamData);

        // Fetch Players
        const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true });

        if (playerData) setPlayers(playerData);

        setLoading(false);
    }

    async function handleAddPlayer(e: React.FormEvent) {
        e.preventDefault();
        const { data, error } = await supabase
            .from('players')
            .insert([{ ...newPlayer, team_id: teamId }])
            .select();

        if (error) {
            alert('Error adding player: ' + error.message);
        } else {
            setPlayers([...players, ...(data || [])]);
            setNewPlayer({ name: '', role: 'Batter' });
            setIsAdding(false);
        }
    }

    async function handleDeletePlayer(playerId: string) {
        if (confirm('Are you sure you want to remove this player?')) {
            const { error } = await supabase.from('players').delete().eq('id', playerId);
            if (!error) {
                setPlayers(players.filter(p => p.id !== playerId));
            }
        }
    }

    if (loading) return <div className="p-8 text-emerald-100/40">Loading team details...</div>;
    if (!team) return <div className="p-8 text-red-500">Team not found</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/teams" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-black gold-text">{team.name}</h2>
                    <p className="text-emerald-100/40 font-mono">{team.short_name} • {players.length} Players</p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-gold/5 p-6 rounded-2xl border border-gold/10">
                <h3 className="text-xl font-bold">Roster Management</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold font-bold rounded-xl hover:bg-gold/20 transition-all border border-gold/20"
                >
                    <Plus size={18} /> Add Player
                </button>
            </div>

            {isAdding && (
                <div className="glass p-6">
                    <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Player Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Babar Azam"
                                value={newPlayer.name}
                                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Role</label>
                            <select
                                value={newPlayer.role}
                                onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                                className="w-full bg-[#0a0f0d] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none text-white"
                            >
                                <option value="Batter">Batter</option>
                                <option value="Bowler">Bowler</option>
                                <option value="All-rounder">All-rounder</option>
                                <option value="Wicket-Keeper">Wicket-Keeper</option>
                            </select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map(player => (
                    <div key={player.id} className="glass p-5 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-900/50 rounded-full flex items-center justify-center font-bold text-emerald-400">
                                {player.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold">{player.name}</p>
                                <p className="text-xs text-gold uppercase tracking-widest font-medium mt-1">{player.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="p-2 text-emerald-100/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {players.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center text-emerald-100/40 glass">
                        No players added yet. Click "Add Player" to build your squad.
                    </div>
                )}
            </div>
        </div>
    );
}
