'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Trash2, Edit2, Shield } from 'lucide-react';

interface Team {
    id: string;
    name: string;
    short_name: string;
    logo_url: string | null;
    created_at: string;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', short_name: '' });

    useEffect(() => {
        fetchTeams();
    }, []);

    async function fetchTeams() {
        setLoading(true);
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching teams:', error);
        } else {
            setTeams(data || []);
        }
        setLoading(false);
    }

    async function handleAddTeam(e: React.FormEvent) {
        e.preventDefault();
        const { data, error } = await supabase
            .from('teams')
            .insert([newTeam])
            .select();

        if (error) {
            alert('Error adding team: ' + error.message);
        } else {
            setTeams([...(data || []), ...teams]);
            setNewTeam({ name: '', short_name: '' });
            setIsAdding(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Teams</h2>
                    <p className="text-emerald-100/40 text-sm">Manage participating squads</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-gold/80 transition-all"
                >
                    <Plus size={20} /> Add Team
                </button>
            </div>

            {isAdding && (
                <div className="glass p-6 border-gold/30">
                    <form onSubmit={handleAddTeam} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Team Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Team Islamabad"
                                value={newTeam.name}
                                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-emerald-100/40 tracking-wider">Short Name</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. TIB"
                                value={newTeam.short_name}
                                onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-gold outline-none"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-emerald-100/20 italic">Loading teams...</p>
                ) : teams.length === 0 ? (
                    <p className="text-emerald-100/20 italic">No teams registered yet.</p>
                ) : teams.map((team) => (
                    <div key={team.id} className="glass p-6 group hover:border-gold/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-16 w-16 glass rounded-2xl flex items-center justify-center font-black text-2xl text-gold group-hover:scale-110 transition-transform">
                                {team.short_name[0]}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 bg-white/5 rounded-lg hover:text-gold"><Edit2 size={16} /></button>
                                <button className="p-2 bg-white/5 rounded-lg hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold">{team.name}</h3>
                        <p className="text-xs text-emerald-100/40 font-mono tracking-tighter uppercase mb-6">{team.short_name}</p>

                        <button className="w-full mt-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-gold/30 hover:bg-gold/5 transition-all text-emerald-100/60 hover:text-gold flex items-center justify-center gap-2">
                            <Shield size={14} /> Team Details
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
