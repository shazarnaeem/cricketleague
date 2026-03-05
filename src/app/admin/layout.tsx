'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Trophy, Settings, LogOut } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#0a0f0d] text-white">
            {/* Sidebar */}
            <aside className="w-64 glass m-4 mr-0 border-r-0 rounded-r-none flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-black gold-text tracking-tighter">ADMIN PANEL</h2>
                    <p className="text-[10px] text-emerald-100/30 uppercase tracking-[0.2em]">PUBGM WOW RAMADAN</p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                    <SidebarLink href="/admin/teams" icon={<Users size={20} />} label="Teams" />
                    <SidebarLink href="/admin/matches" icon={<Trophy size={20} />} label="Matches" />
                    <SidebarLink href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-emerald-100/40 hover:text-red-400 transition-colors">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, Admin</h1>
                        <p className="text-emerald-100/40 text-sm">Managing the Ramadan Cricket Showdown</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center font-bold text-gold">
                            A
                        </div>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${active
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-emerald-100/40 hover:bg-white/5 hover:text-white'
                }`}
        >
            {icon} {label}
        </Link>
    );
}
