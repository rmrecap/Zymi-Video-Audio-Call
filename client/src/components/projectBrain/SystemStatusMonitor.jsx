import React from 'react';

const SystemStatusMonitor = ({ health }) => {
  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          System Status Monitor
        </h3>
        <span className="text-xs text-slate-500 font-mono">Real-time Telemetry</span>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">Database Engine</span>
            <span className="text-sm font-mono text-blue-400">{health?.database?.provider}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">Migration Integrity</span>
            <span className="text-sm font-mono text-emerald-400">{health?.database?.migrationStatus}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">Socket Adapter</span>
            <span className="text-sm font-mono text-violet-400">{health?.socket?.adapter}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">Active OTP Tokens</span>
            <span className="text-sm font-mono text-amber-400">{health?.otp?.activeTokens}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">Encryption Layer</span>
            <span className="text-sm font-mono text-emerald-400">AES-256-CBC</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-400">User Lookup Engine</span>
            <span className="text-sm font-mono text-blue-400">Internal Index</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusMonitor;
