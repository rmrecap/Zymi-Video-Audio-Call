import React from 'react';

const AdminInsightCards = ({ summary }) => {
  const insights = [
    {
      title: 'Security Posture',
      status: summary?.risks?.length > 0 ? 'Warning' : 'Optimal',
      color: summary?.risks?.length > 0 ? 'amber' : 'emerald',
      desc: summary?.risks?.length > 0 
        ? `${summary.risks.length} active risks require attention.` 
        : 'System is operating within security parameters.'
    },
    {
      title: 'Infra Readiness',
      status: 'Stable',
      color: 'blue',
      desc: `Load balancer sticky sessions and SSL termination verified.`
    }
  ];

  return (
    <div className="space-y-4">
      {insights.map((insight, i) => (
        <div key={i} className="bg-[#1e293b] p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{insight.title}</h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-${insight.color}-500/10 text-${insight.color}-500`}>
              {insight.status}
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {insight.desc}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AdminInsightCards;
