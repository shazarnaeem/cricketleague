'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { Activity, Radio, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicScorecard() {
    const params = useParams();
    const matchId = params.id as string;

    const [matchData, setMatchData] = useState<any>(null);
    const [balls, setBalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived state
    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [overs, setOvers] = useState(0.0);

    useEffect(() => {
        fetchInitialData();

        // 🔴 SUPABASE REALTIME SUBSCRIPTION 🔴
        const matchChannel = supabase.channel(`match-${matchId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'match_balls', filter: `match_id=eq.${matchId}` },
                (payload) => {
                    // Add new ball to stream
                    setBalls(prev => [payload.new, ...prev]);

                    // Update live score math dynamically
                    const newBall = payload.new;
                    setRuns(prev => prev + newBall.runs_scored + newBall.extras);
                    if (newBall.wicket) setWickets(prev => prev + 1);

                    if (newBall.extras === 0) {
                        setOvers(prev => {
                            const b = Math.round((prev % 1) * 10) + 1;
                            return b === 6 ? Math.floor(prev) + 1.0 : prev + 0.1;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matchChannel);
        };
    }, [matchId]);

    async function fetchInitialData() {
        // Fetch match metadata
        const { data: match } = await supabase
            .from('matches')
            .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)')
            .eq('id', matchId)
            .single();

        if (match) setMatchData(match);

        // Fetch existing balls to calculate current score
        const { data: existingBalls } = await supabase
            .from('match_balls')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false });

        if (existingBalls) {
            setBalls(existingBalls);

            let totRuns = 0;
            let totWickets = 0;
            let validBalls = 0;

            existingBalls.forEach(b => {
                totRuns += b.runs_scored + b.extras;
                if (b.wicket) totWickets += 1;
                if (b.extras === 0) validBalls += 1;
            });

            setRuns(totRuns);
            setWickets(totWickets);
            const fullOvers = Math.floor(validBalls / 6);
            const remBalls = validBalls % 6;
            setOvers(fullOvers + (remBalls / 10));
        }
        setLoading(false);
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gold pt-20">Loading Live Stats...</div>;
    if (!matchData) return <div className="min-h-screen flex items-center justify-center text-red-500 pt-20">Match Not Found</div>;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto space-y-8">

            <Link href="/" className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white transition-colors">
                <ArrowLeft size={20} /> Back to Homepage
            </Link>

            {/* Main Scorecard Header */}
            <div className="glass p-8 md:p-12 relative overflow-hidden rounded-3xl border-t-4 border-t-gold">
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/20 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse">
                    <Radio size={14} /> {matchData.status === 'live' ? 'Live Match' : matchData.status}
                </div>

                <div className="text-center space-y-8 mt-4">
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                        {matchData.team1.name} <br />
                        <span className="text-white/20 text-2xl md:text-4xl px-4 italic block my-2">VS</span>
                        {matchData.team2.name}
                    </h1>

                    <div className="inline-block relative">
                        <div className="absolute -inset-4 bg-gold/10 blur-xl opacity-50 rounded-full"></div>
                        <div className="relative z-10 text-7xl md:text-9xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                            {runs}<span className="text-4xl md:text-6xl text-emerald-100/40 relative -top-4 md:-top-8">/{wickets}</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full flex items-center gap-3">
                            <span className="text-emerald-100/40 text-xs font-bold uppercase tracking-widest">Overs</span>
                            <span className="text-2xl font-black text-gold tabular-nums">{overs.toFixed(1)}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full flex items-center gap-3">
                            <span className="text-emerald-100/40 text-xs font-bold uppercase tracking-widest">CRR</span>
                            <span className="text-2xl font-black text-white tabular-nums">
                                {(runs / (Math.floor(overs) + (overs % 1) * 10 / 6) || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ball by Ball Commentary */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2 gold-text border-b border-white/10 pb-4">
                    <Activity size={24} /> Ball-by-Ball Updates
                </h3>

                <div className="space-y-3">
                    {balls.length === 0 ? (
                        <div className="glass p-6 text-center text-emerald-100/40 italic">Waiting for first ball...</div>
                    ) : (
                        balls.map((ball) => (
                            <div key={ball.id} className="glass p-4 flex items-center gap-6 group hover:border-gold/30 transition-all">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-col shrink-0">
                                    <span className="text-[10px] text-emerald-100/40 uppercase font-bold tracking-widest">Over</span>
                                    <span className="text-lg font-black">{ball.over_no}.{ball.ball_no}</span>
                                </div>

                                <div className="flex-1">
                                    <p className={`text-lg font-medium ${ball.wicket ? 'text-red-500 font-bold' : ball.runs_scored >= 4 ? 'text-gold font-bold' : 'text-white'}`}>
                                        {ball.commentary}
                                    </p>
                                </div>

                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${ball.wicket ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                        ball.runs_scored === 6 ? 'bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' :
                                            ball.runs_scored === 4 ? 'bg-emerald-500 text-black' :
                                                'bg-white/10 text-white'
                                    }`}>
                                    {ball.wicket ? 'W' : ball.runs_scored + (ball.extras > 0 ? `+` : '')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
