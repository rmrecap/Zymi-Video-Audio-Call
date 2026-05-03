import React from 'react';

const ProjectHealthGrid = ({ health }) => {
  const metrics = [
    { label: 'Auth System', value: health?.auth?.status, color: 'blue' },
    { label: 'OTP Gateway', value: health?.otp?.status, color: 'indigo' },
    { label: 'SMTP Config', value: health?.email?.status, color: 'cyan' },
    { label: 'User Lookup', value: health?.userLookup?.status, color: 'emerald' },
    { label: 'Socket.io', value: health?.socket?.status, color: 'violet' },
    { label: 'Database', value: health?.database?.status, color: 'sky' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">{m.label}</div>
          <div className={`text-sm font-bold uppercase ${m.value === 'ok' || m.value === 'healthy' || m.value === 'configured' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {m.value || 'Unknown'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectHealthGrid;
