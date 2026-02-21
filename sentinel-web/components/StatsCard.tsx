interface StatsCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  label: string;
  value: string;
  badge?: string;
  badgeClass?: string;
  subtext?: string;
}

export default function StatsCard({
  icon,
  iconBgClass,
  label,
  value,
  badge,
  badgeClass = 'bg-emerald-50 text-emerald-600',
  subtext,
}: StatsCardProps) {
  return (
    <div className="stat-card-gradient rounded-2xl p-6 refined-shadow refined-border">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-display font-extrabold text-slate-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
  );
}
