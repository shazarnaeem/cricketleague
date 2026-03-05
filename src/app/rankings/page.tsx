'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Shield } from 'lucide-react';
import Link from 'next/link';

interface TeamStats {
    id: string;
    name: string;
    short_name: string;
    matches_played: number;
    won: number;
    lost: number;
    tied: number;
    points: number;
    nrr: string;
}

export default function RankingsPage() {
    const [standings, setStandings] = useState<TeamStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStandings();
    }, []);

    async function fetchStandings() {
        // 1. Fetch all teams
        const { data: teams } = await supabase.from('teams').select('*');
        if (!teams) return;

        // 2. Fetch all completed matches
        const { data: matches } = await supabase
            .from('matches')
            .select('*')
            .eq('status', 'completed');

        // 3. Simple Standing Calculation
        const statsMap: Record<string, TeamStats> = {};
        teams.forEach(t => {
            statsMap[t.id] = {
                id: t.id,
                name: t.name,
                short_name: t.short_name,
                matches_played: 0,
                won: 0,
                lost: 0,
                tied: 0,
                points: 0,
                nrr: "0.000" // Requires complex ball-by-ball analysis, simplified for MVP
            };
        });

        if (matches) {
            matches.forEach(m => {
                if (m.winner_id) {
                    statsMap[m.team1_id].matches_played += 1;
                    statsMap[m.team2_id].matches_played += 1;

                    if (m.team1_id === m.winner_id) {
                        statsMap[m.team1_id].won += 1;
                        statsMap[m.team1_id].points += 2;
                        statsMap[m.team2_id].lost += 1;
                    } else if (m.team2_id === m.winner_id) {
                        statsMap[m.team2_id].won += 1;
                        statsMap[m.team2_id].points += 2;
                        statsMap[m.team1_id].lost += 1;
                    }
                }
            });
        }

        const sortedStandings = Object.values(statsMap).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return (b.won - a.won);
        });

        setStandings(sortedStandings);
        setLoading(false);
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-8">

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass p-8 rounded-3xl border-t-4 border-t-gold">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-gold/10 rounded-2xl flex items-center justify-center text-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                        <Trophy size={40} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight uppercase">Showdown Rankings</h1>
                        <p className="text-emerald-100/60 font-medium tracking-wide mt-2 uppercase text-sm">Official Points Table</p>
                    </div>
                </div>
            </div>

            <div className="glass overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-xs uppercase tracking-widest text-emerald-100/40">
                                <th className="p-6 font-bold w-16 text-center">Pos</th>
                                <th className="p-6 font-bold">Team</th>
                                <th className="p-6 font-bold text-center">P</th>
                                <th className="p-6 font-bold text-center">W</th>
                                <th className="p-6 font-bold text-center">L</th>
                                <th className="p-6 font-bold text-center">T</th>
                                <th className="p-6 font-bold text-center">NRR</th>
                                <th className="p-6 font-black text-gold text-lg text-center">PTS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-emerald-100/40 animate-pulse">Calculating standings...</td>
                                </tr>
                            ) : standings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-emerald-100/40">No teams registered.</td>
                                </tr>
                            ) : standings.map((team, index) => (
                                <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 text-center font-black text-white/40">{index + 1}</td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-emerald-900/50 rounded-lg flex items-center justify-center font-black text-gold border border-gold/10 group-hover:border-gold/50 transition-colors">
                                                {team.short_name[0]}
                                            </div>
                                            <span className="font-bold text-lg">{team.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center text-emerald-100/60 font-mono text-lg">{team.matches_played}</td>
                                    <td className="p-6 text-center text-green-400 font-mono text-lg">{team.won}</td>
                                    <td className="p-6 text-center text-red-400 font-mono text-lg">{team.lost}</td>
                                    <td className="p-6 text-center text-emerald-100/60 font-mono text-lg">{team.tied}</td>
                                    <td className="p-6 text-center text-emerald-100/60 font-mono">{team.nrr}</td>
                                    <td className="p-6 text-center font-black text-gold text-2xl drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">{team.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
