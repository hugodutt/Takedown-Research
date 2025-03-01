interface QuickStatProps {
  label: string;
  value: string;
}

export function QuickStat({ label, value }: QuickStatProps) {
  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/5 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative p-2">
        <div className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{label}</div>
        <div className="text-sm font-semibold text-white truncate">{value}</div>
      </div>
    </div>
  );
} 