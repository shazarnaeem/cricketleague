'use client';

import React from 'react';
import { Users, Trophy, Activity, Calendar } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Users size={24} />} value="12" label="Total Teams" />
                <StatCard icon={<Trophy size={24} />} value="24" label="Matches Played" />
                <StatCard icon={<Activity size={24} />} value="Live" label="Current Status" />
                <StatCard icon={<Calendar size={24} />} value="Mar 20" label="Final Date" />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 space-y-4">
                    <h2 className="text-xl font-bold">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 rounded-2xl bg-gold/10 border border-gold/20 hover:bg-gold/20 transition-all text-left group">
                            <p className="font-bold group-hover:text-gold transition-colors">Start Match</p>
                            <p className="text-xs text-emerald-100/40">Launch live scorer</p>
                        </button>
                        <button className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group">
                            <p className="font-bold group-hover:text-white transition-colors">Add Team</p>
                            <p className="text-xs text-emerald-100/40">Register new squad</p>
                        </button>
                    </div>
                </div>

                <div className="glass p-8 space-y-4">
                    <h2 className="text-xl font-bold">System Status</h2>
                    <div className="space-y-3">
                        <StatusRow label="Supabase Connection" status="Connected" color="text-green-500" />
                        <StatusRow label="Realtime Sync" status="Active" color="text-green-500" />
                        <StatusRow label="Public Site" status="Live" color="text-green-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="glass p-6 border-l-2 border-l-gold">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gold/10 rounded-xl text-gold">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-black">{value}</p>
                    <p className="text-xs text-emerald-100/40 uppercase tracking-wider font-bold">{label}</p>
                </div>
            </div>
        </div>
    );
}

function StatusRow({ label, status, color }: { label: string; status: string; color: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <span className="text-sm text-emerald-100/60">{label}</span>
            <span className={`text-sm font-bold ${color}`}>{status}</span>
        </div>
    );
}
