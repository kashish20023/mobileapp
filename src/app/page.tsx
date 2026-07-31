'use client';

import React from 'react';
import MobileSimulator from '../components/MobileSimulator';
import ApiConsole from '../components/ApiConsole';
import { Compass, Sparkles, Code2, Database } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-slate-100 font-sans">
      
      {/* Premium Navigation Header */}
      <header className="glass-panel border-b border-slate-900 px-6 py-4 sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-lg blur-md opacity-40 animate-pulse"></div>
              <div className="relative bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-lg text-white">
                <Compass size={22} className="animate-spin" style={{ animationDuration: '12s' }} />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Hobnob Mobile API Client Simulator
                <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  Dev Edition
                </span>
              </h1>
              <p className="text-xs text-slate-400">Interactive endpoint tester & mobile wrapper for React Native prototyping</p>
            </div>
          </div>

          {/* Quick Stats/Links */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <Code2 size={13} className="text-indigo-400" />
              <span>Target: NestJS Core</span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden md:block"></div>
            <div className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-full border border-indigo-500/10">
              <Sparkles size={13} className="text-indigo-300" />
              <span className="font-semibold">Tailwind v4 Powered</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace split panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-6 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* Left Side - Simulator Wrapper */}
        <section className="w-full lg:w-[400px] flex flex-col justify-start items-center shrink-0">
          <div className="w-full glass-panel rounded-2xl p-6 shadow-xl border-slate-800">
            <div className="mb-4 text-center border-b border-slate-800/80 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Mobile Preview</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">React Native simulated viewports</p>
            </div>
            <MobileSimulator />
          </div>
        </section>

        {/* Right Side - API inspector Console */}
        <section className="flex-1 min-w-0">
          <ApiConsole />
        </section>

      </main>

      {/* Developer Footer */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950/40 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Hobnob Dev Tools. Built for sandbox validation of React Native API endpoints.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Database size={11} className="text-emerald-400" />
              API Status: Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
