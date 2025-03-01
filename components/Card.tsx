interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Card({ title, children, className = '', icon }: CardProps) {
  return (
    <div className={`group bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all duration-300 ${className}`}>
      <div className="border-b border-white/5 p-2 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <svg className="w-4 h-4 text-emerald-500 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {title}
          </h2>
        </div>
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
} 