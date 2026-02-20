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
  badgeClass = 'bg-emerald-100 text-emerald-700',
  subtext,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 refined-shadow refined-border">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgClass}`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badgeClass}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-4xl font-display font-black text-slate-900 tracking-tight">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
  );
}
