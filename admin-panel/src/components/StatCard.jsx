export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 glow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-white/40 tracking-wider uppercase">{label}</p>
          <p className={`text-3xl font-bold mt-2 font-mono ${color || 'text-white'}`}>{value ?? '—'}</p>
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
}
