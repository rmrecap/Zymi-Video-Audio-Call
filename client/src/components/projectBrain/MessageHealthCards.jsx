import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const MessageHealthCards = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages/health/messages`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch message health', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const cards = [
    { label: 'Total Messages', value: stats?.total || 0, color: 'text-blue-400' },
    { label: 'Queued (Offline)', value: stats?.queued || 0, color: 'text-yellow-400' },
    { label: 'Delivered', value: stats?.delivered || 0, color: 'text-green-400' },
    { label: 'Read Receipts', value: stats?.read || 0, color: 'text-purple-400' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{card.label}</div>
          <div className={`text-2xl font-mono font-bold ${card.color}`}>
            {card.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageHealthCards;
