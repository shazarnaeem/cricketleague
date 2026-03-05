'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, PlayCircle, PlusCircle, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LiveScoringPage() {
    const params = useParams();
    const matchId = params.id as string;

    const [matchData, setMatchData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Local State for Current Over
    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [overs, setOvers] = useState(0.0);

    useEffect(() => {
        fetchMatchDetails();
    }, [matchId]);

    async function fetchMatchDetails() {
        setLoading(true);
        const { data: match, error } = await supabase
            .from('matches')
            .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)')
            .eq('id', matchId)
            .single();

        if (match) {
            setMatchData(match);
            // Ensure match is marked as live
            if (match.status !== 'live') {
                await supabase.from('matches').update({ status: 'live' }).eq('id', matchId);
            }
        }
        setLoading(false);
    }

    // Simplified ball processor for demonstration purposes
    async function handleBall(runScored: number, isWicket: boolean = false, extra: string = '') {
        // 1. Calculate new score purely locally for now to provide instant feedback
        setRuns(prev => prev + runScored + (extra ? 1 : 0));
        if (isWicket) setWickets(prev => prev + 1);

        // Update overs (0.1 -> 0.2 -> 0.3 -> 0.4 -> 0.5 -> 1.0)
        if (!extra) {
            setOvers(prev => {
                const balls = Math.round((prev % 1) * 10) + 1;
                if (balls === 6) {
                    return Math.floor(prev) + 1.0;
                }
                return prev + 0.1;
            });
        }

        // 2. Persist to Supabase ball-by-ball table
        // In a real app, you would select the current batter and bowler IDs.
        await supabase.from('match_balls').insert([{
            match_id: matchId,
            innings_no: 1, // hardcoded for brevity
            over_no: Math.floor(overs),
            ball_no: Math.round((overs % 1) * 10) + 1,
            runs_scored: runScored,
            extras: extra ? 1 : 0,
            extra_type: extra || null,
            wicket: isWicket,
            commentary: `${runScored} runs${isWicket ? ' and WICKET!' : ''}`
        }]);
    }

    if (loading) return <div className="p-8 text-gold animate-pulse">Loading Live Match Engine...</div>;
    if (!matchData) return <div className="p-8 text-red-500">Match Not Found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/matches" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                    <h2 className="text-2xl font-bold tracking-tight">LIVE SCORING</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Scoreboard Display (Admin View) */}
                <div className="lg:col-span-2 glass flex flex-col items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 font-mono text-emerald-100/40 text-sm">
                        Innings 1
                    </div>

                    <h3 className="text-2xl font-black mb-8 gold-text tracking-widest uppercase">
                        {matchData.team1.short_name} <span className="text-white/20 px-4">VS</span> {matchData.team2.short_name}
                    </h3>

                    <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-8xl font-black tabular-nums tracking-tighter shadow-xl">
                            {runs}<span className="text-4xl text-emerald-100/40 font-bold ml-2">/ {wickets}</span>
                        </span>
                    </div>

                    <div className="bg-gold/10 border border-gold/20 px-8 py-3 rounded-full mt-4 flex items-center gap-4">
                        <span className="text-emerald-100/60 uppercase text-sm font-bold tracking-widest">Overs</span>
                        <span className="text-3xl font-bold text-gold tabular-nums">{overs.toFixed(1)}</span>
                    </div>
                </div>

                {/* Scoring Controls */}
                <div className="glass p-6 space-y-6 flex flex-col">
                    <h3 className="font-bold text-lg gold-text border-b border-white/5 pb-4">Action Panel</h3>

                    <div className="space-y-2 flex-1">
                        <p className="text-xs uppercase font-bold text-emerald-100/40">Runs Scored</p>
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3, 4, 6].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleBall(num)}
                                    className={`py-4 rounded-xl font-bold text-lg transition-all ${num === 4 || num === 6
                                            ? 'bg-gold text-black hover:bg-gold/80 hover:scale-105'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs uppercase font-bold text-emerald-100/40">Extras & Events</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleBall(0, true)}
                                className="bg-red-600/20 text-red-500 font-bold border border-red-500/20 py-4 rounded-xl hover:bg-red-600/40 transition-all flex items-center justify-center gap-2"
                            >
                                <UserMinus size={18} /> WICKET
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleBall(0, false, 'wide')} className="bg-white/5 border border-white/10 py-4 rounded-xl font-bold hover:bg-white/10 text-sm">Wide</button>
                                <button onClick={() => handleBall(0, false, 'no-ball')} className="bg-white/5 border border-white/10 py-4 rounded-xl font-bold hover:bg-white/10 text-sm">No Ball</button>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full mt-auto py-4 bg-emerald-700/20 text-emerald-400 font-bold tracking-widest uppercase rounded-xl border border-emerald-500/20 hover:bg-emerald-700/40 transition-all"
                        onClick={() => confirm('End this innings and switch teams?')}
                    >
                        End Innings
                    </button>
                </div>
            </div>
        </div>
    );
}
