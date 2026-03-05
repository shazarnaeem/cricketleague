'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Player {
    id: string;
    name: string;
    role: string;
}

interface Team {
    id: string;
    name: string;
    short_name: string;
    players?: Player[];
}

export default function PublicTeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamsAndPlayers();
    }, []);

    async function fetchTeamsAndPlayers() {
        // Fetch all teams
        const { data: teamsData } = await supabase.from('teams').select('*').order('name');

        if (teamsData) {
            // Fetch all players
            const { data: playersData } = await supabase.from('players').select('*');

            // Group players by team
            const playersByTeam: Record<string, Player[]> = {};
            if (playersData) {
                playersData.forEach(p => {
                    if (!playersByTeam[p.team_id]) playersByTeam[p.team_id] = [];
                    playersByTeam[p.team_id].push(p);
                });
            }

            const enrichedTeams = teamsData.map(t => ({
                ...t,
                players: playersByTeam[t.id] || []
            }));

            setTeams(enrichedTeams);
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-12">

            <div className="text-center space-y-4 mb-16">
                <span className="text-gold uppercase tracking-widest font-bold text-sm">Official Roster</span>
                <h1 className="text-5xl font-black uppercase tracking-tight">Teams & Players</h1>
                <p className="text-emerald-100/60 max-w-xl mx-auto">
                    Meet the squads competing in the PUBGM WOW Ramadan Cricket Showdown.
                </p>
            </div>

            {loading ? (
                <div className="text-center text-gold animate-pulse py-12">Loading Squads...</div>
            ) : teams.length === 0 ? (
                <div className="text-center text-emerald-100/40 py-12 glass max-w-md mx-auto">No teams have registered yet.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teams.map(team => (
                        <div key={team.id} className="glass overflow-hidden rounded-3xl flex flex-col group hover:border-gold/30 transition-all">
                            {/* Team Header */}
                            <div className="bg-gradient-to-br from-emerald-900/50 to-black p-8 relative overflow-hidden border-b border-white/5">
                                <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32 transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl glass flex items-center justify-center text-gold font-black text-2xl shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                        {team.short_name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
                                        <p className="text-gold font-mono uppercase text-xs tracking-widest mt-1">{team.short_name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Player List */}
                            <div className="p-6 flex-1 flex flex-col gap-3">
                                <h3 className="text-xs uppercase tracking-widest text-emerald-100/40 font-bold mb-2">Squad Roster ({team.players?.length || 0})</h3>

                                {team.players?.length === 0 ? (
                                    <p className="text-sm text-emerald-100/20 italic">No players announced yet.</p>
                                ) : (
                                    team.players?.slice(0, 5).map(player => (
                                        <div key={player.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                                            <span className="font-bold text-sm">{player.name}</span>
                                            <span className="text-xs text-emerald-100/60">{player.role}</span>
                                        </div>
                                    ))
                                )}

                                {team.players && team.players.length > 5 && (
                                    <p className="text-xs text-emerald-100/40 text-center mt-2 italic">
                                        + {team.players.length - 5} more players
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center mt-12">
                <Link href="/" className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white transition-colors">
                    <ChevronRight className="rotate-180" size={20} /> Return to Homepage
                </Link>
            </div>

        </div>
    );
}
