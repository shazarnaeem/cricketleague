'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Users, Activity, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  status: string;
  team1: { name: string; short_name: string };
  team2: { name: string; short_name: string };
  result_margin: string;
}

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();

    const matchChannel = supabase.channel('public-matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, []);

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(4);

    if (data) setMatches(data);
    setLoading(false);
  }

  return (
    <main className="min-h-screen ramadan-gradient selection:bg-emerald-700 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('/islamic-pattern.svg')] bg-repeat opacity-5"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="z-10"
        >
          <span className="bg-gold/10 border border-gold/20 text-gold px-6 py-2 rounded-full uppercase tracking-widest font-bold text-xs mb-8 inline-block shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            Official Cricket Management Portal
          </span>
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
            PUBGM WOW <br />
            <span className="text-white drop-shadow-xl">RAMADAN CRICKET</span> <br />
            <span className="gold-text animate-float inline-block mt-2">SHOWDOWN</span>
          </h1>
          <p className="text-emerald-100/60 max-w-2xl mx-auto text-lg mb-10 leading-relaxed font-medium">
            Experience the ultimate cricket showdown this Ramadan. Professional live scoring, real-time rankings, and team management all in one place.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="#live-matches" className="px-8 py-4 bg-[#d4af37] text-black font-extrabold rounded-full hover:bg-[#ffd700] hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
              Live Scores <Activity size={20} />
            </Link>
            <Link href="/rankings" className="px-8 py-4 glass text-white font-bold rounded-full hover:bg-white/10 transition-all flex items-center gap-2">
              View Rankings <Trophy size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats/Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Trophy className="text-[#d4af37]" size={32} />}
            title="Championships"
            desc="Track tournament progress with dynamic brackets and points tables."
            link="/rankings"
            linkText="View Leaderboard"
          />
          <FeatureCard
            icon={<Users className="text-[#d4af37]" size={32} />}
            title="Team & Players"
            desc="Detailed profiles, performance stats, and career history at your fingertips."
            link="/teams"
            linkText="Meet the Squads"
          />
          <FeatureCard
            icon={<Activity className="text-[#d4af37]" size={32} />}
            title="Live Stats"
            desc="Ball-by-ball updates powered by Supabase Realtime synchronization."
            link="#live-matches"
            linkText="Watch Live"
          />
        </div>
      </section>

      {/* Recent Matches Preview */}
      <section id="live-matches" className="max-w-6xl mx-auto px-4 pb-32">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black gold-text tracking-tight border-l-4 border-gold pl-4">Latest Showdowns</h2>
            <p className="text-emerald-100/40 mt-2 pl-5 font-medium">Live action and recent results</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gold animate-pulse py-12">Loading Match Data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.length === 0 ? (
              <div className="col-span-full glass p-12 text-center text-emerald-100/40">No matches scheduled yet.</div>
            ) : matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc, link, linkText }: { icon: any, title: string, desc: string, link: string, linkText: string }) {
  return (
    <div className="glass p-8 hover:border-[#d4af37]/50 transition-all group flex flex-col h-full">
      <div className="mb-6 p-4 bg-gold/5 inline-block rounded-2xl group-hover:bg-gold/10 transition-colors group-hover:scale-110 transform duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">{icon}</div>
      <h3 className="text-2xl font-black mb-3 tracking-tight">{title}</h3>
      <p className="text-emerald-100/60 leading-relaxed text-sm flex-1">{desc}</p>
      <Link href={link} className="mt-6 flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-widest group-hover:text-white transition-colors">
        {linkText} <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';

  return (
    <div className={`glass p-8 flex flex-col gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform ${isLive ? 'border-gold shadow-[0_0_30px_rgba(212,175,55,0.15)] ring-1 ring-gold' : 'border-l-4 border-l-emerald-600'}`}>
      {isLive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
      )}

      <div className="flex justify-between items-center text-xs uppercase tracking-widest text-emerald-100/40 font-bold border-b border-white/5 pb-4">
        <span>Showdown Match</span>
        <span className={`${isLive ? 'text-red-500 bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-2 font-black shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-white/5 px-3 py-1 rounded-full'}`}>
          {isLive && <span className="w-2 h-2 rounded-full bg-red-500 block"></span>}
          {match.status}
        </span>
      </div>

      <div className="flex justify-between items-center py-2">
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900/80 to-[#0a0f0d] border border-emerald-500/20 flex items-center justify-center font-black text-3xl text-gold shadow-lg group-hover:scale-110 transition-transform duration-500">
            {match.team1?.short_name[0] || '?'}
          </div>
          <span className="font-extrabold text-lg tracking-tight text-center">{match.team1?.name}</span>
          <span className="text-xs text-emerald-100/40 uppercase tracking-widest">{match.team1?.short_name}</span>
        </div>

        <div className="px-6 flex flex-col items-center justify-center">
          <div className="text-3xl font-black text-white/10 italic select-none">VS</div>
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-900/80 to-[#0a0f0d] border border-emerald-500/20 flex items-center justify-center font-black text-3xl text-gold shadow-lg group-hover:scale-110 transition-transform duration-500">
            {match.team2?.short_name[0] || '?'}
          </div>
          <span className="font-extrabold text-lg tracking-tight text-center">{match.team2?.name}</span>
          <span className="text-xs text-emerald-100/40 uppercase tracking-widest">{match.team2?.short_name}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 text-center flex flex-col items-center gap-4">
        {isLive ? (
          <Link href={`/matches/${match.id}`} className="px-8 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/40 rounded-full font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-all group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            <Play size={16} className="fill-current" /> Watch Live Center
          </Link>
        ) : (
          <p className="text-emerald-100/60 font-medium">
            {match.result_margin || 'Result Pending'}
          </p>
        )}
      </div>
    </div>
  );
}
