'use client';

import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';

interface StatsPanelProps {
  totalStars?: number;
  totalSchools?: number;
  averageAge?: number;
  newThisMonth?: number;
  variant?: 'default' | 'minimalist';
}

export default function StatsPanel({ 
  totalStars = 0, 
  totalSchools = 0, 
  averageAge = 0, 
  newThisMonth = 0,
  variant = 'default'
}: StatsPanelProps) {
  if (variant === 'minimalist') {
    return (
      <div className="flex items-center justify-between md:justify-start md:gap-6 w-full md:w-auto px-1">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 group cursor-default">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-blue-500 group-hover:scale-110 transition-transform md:w-4 md:h-4" />
            <span className="text-[14px] md:text-base font-black leading-none" style={{ color: 'var(--foreground)' }}>{totalStars}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest md:text-xs">位艺人</span>
        </div>
        
        <div className="h-6 w-px bg-gray-100 dark:bg-gray-800 md:h-4 md:bg-gray-200/60" />
        
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 group cursor-default text-center md:text-left">
          <div className="flex items-center gap-1.5 justify-center md:justify-start">
            <Building2 size={14} className="text-emerald-500 group-hover:scale-110 transition-transform md:w-4 md:h-4" />
            <span className="text-[14px] md:text-base font-black leading-none" style={{ color: 'var(--foreground)' }}>{totalSchools}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest md:text-xs">所学校</span>
        </div>
        
        <div className="h-6 w-px bg-gray-100 dark:bg-gray-800 md:h-4 md:bg-gray-200/60" />
        
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 group cursor-default text-right md:text-left">
          <div className="flex items-center gap-1.5 justify-end md:justify-start">
            <Calendar size={14} className="text-purple-500 group-hover:scale-110 transition-transform md:w-4 md:h-4" />
            <span className="text-[14px] md:text-base font-black leading-none" style={{ color: 'var(--foreground)' }}>{averageAge}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest md:text-xs">平均岁数</span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: '总明星数',
      value: totalStars,
      icon: Users,
      color: 'bg-blue-50 text-blue-500',
    },
    {
      label: '学校数量',
      value: totalSchools,
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-500',
    },
    {
      label: '平均年龄',
      value: averageAge,
      icon: Calendar,
      color: 'bg-purple-50 text-purple-500',
    },
    {
      label: '本月新增',
      value: newThisMonth,
      icon: TrendingUp,
      color: 'bg-orange-50 text-orange-500',
    },
  ];

  return (
    <div className="flex overflow-x-auto no-scrollbar gap-8 py-2 md:grid md:grid-cols-4 md:gap-4">
      {stats.map((item, index) => (
        <div key={index} className="flex-shrink-0 flex items-center gap-3 group">
          <div className={`p-2 rounded-xl transition-all duration-500 group-hover:scale-110 ${item.color} bg-opacity-10`}>
            <item.icon size={16} strokeWidth={2.5} className="md:w-4 md:h-4" fill="currentColor" fillOpacity={0.2} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-400 dark:text-gray-500 text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5 truncate">{item.label}</span>
            <span className="text-sm md:text-base font-black leading-none" style={{ color: 'var(--foreground)' }}>{item.value}</span>
          </div>
          {index < stats.length - 1 && (
            <div className="hidden md:block h-8 w-px bg-gray-100 dark:bg-gray-800 ml-auto self-center" />
          )}
        </div>
      ))}
    </div>
  );
}
