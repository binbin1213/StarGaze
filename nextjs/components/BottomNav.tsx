'use client';

import { Home, Filter, User, ArrowUp, Upload, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BottomNavProps {
  onFilterClick: () => void;
  onAdminClick: () => void;
  onUploadClick: () => void;
  onStarsClick: () => void;
  isAdmin: boolean;
  visitorCount?: number;
}

export default function BottomNav({ onFilterClick, onAdminClick, onUploadClick, onStarsClick, isAdmin, visitorCount }: BottomNavProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    // 假设发布日期是 2026-01-14 12:00:00
    const launchDate = new Date('2026-01-14T12:00:00');
    
    const updateUptime = () => {
      const now = new Date();
      const diff = now.getTime() - launchDate.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setUptime(`${days}天 ${hours}小时 ${minutes}分`);
    };

    updateUptime();
    const timer = setInterval(updateUptime, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center">
      <div className="w-full px-10 pb-2 pt-12 pointer-events-none relative">
        {/* 底部渐变遮罩 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/5 via-black/[0.02] to-transparent dark:from-black/30 dark:via-black/5 dark:to-transparent -z-10" />
        
        <div 
          className="backdrop-blur-md border rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 h-13 pointer-events-auto transition-all duration-300 bg-white/25 dark:bg-black/20"
          style={{ 
            borderColor: 'var(--card-border)',
          }}
        >
        <button 
          onClick={scrollToTop}
          className="flex-1 flex flex-col items-center justify-center h-full group transition-all active:scale-90"
        >
          <div className={`p-1 rounded-2xl transition-all ${!showScrollTop ? 'text-blue-500' : 'opacity-30 group-hover:opacity-100 group-hover:text-blue-500'}`}>
            <Home size={20} strokeWidth={2.5} fill={!showScrollTop ? "currentColor" : "none"} fillOpacity={0.15} />
          </div>
          <span className={`text-[10px] font-bold transition-colors ${!showScrollTop ? 'text-blue-500' : 'opacity-30 group-hover:opacity-80'}`} style={{ color: !showScrollTop ? '' : 'var(--foreground)' }}>首页</span>
        </button>

        <button 
          onClick={onFilterClick}
          className="flex-1 flex flex-col items-center justify-center h-full group transition-all active:scale-90"
        >
          <div className="p-1 rounded-2xl text-emerald-500 opacity-50 group-hover:opacity-100 transition-all">
            <Filter size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
          </div>
          <span className="text-[10px] font-bold opacity-30 group-hover:opacity-80" style={{ color: 'var(--foreground)' }}>筛选</span>
        </button>

        {isAdmin && (
          <button 
            onClick={onUploadClick}
            className="relative flex items-center justify-center mx-1 active:scale-90 transition-all"
          >
            <div 
              className="p-3 rounded-full shadow-lg shadow-blue-500/20 border-2 backdrop-blur-md"
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                borderColor: 'var(--card-bg)',
                color: 'white'
              }}
            >
              <Upload size={20} strokeWidth={3} />
            </div>
          </button>
        )}

        <button 
          onClick={onStarsClick}
          className="flex-1 flex flex-col items-center justify-center h-full group transition-all active:scale-90"
        >
          <div className="p-1 rounded-2xl text-purple-500 opacity-50 group-hover:opacity-100 transition-all">
            <Users size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
          </div>
          <span className="text-[10px] font-bold opacity-30 group-hover:opacity-80" style={{ color: 'var(--foreground)' }}>艺人</span>
        </button>

        <button 
          onClick={onAdminClick}
          className="flex-1 flex flex-col items-center justify-center h-full group transition-all active:scale-90"
        >
          <div className="p-1 rounded-2xl text-orange-500 opacity-50 group-hover:opacity-100 transition-all">
            <User size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
          </div>
          <span className="text-[10px] font-bold opacity-30 group-hover:opacity-80" style={{ color: 'var(--foreground)' }}>{isAdmin ? '管理' : '我的'}</span>
        </button>
      </div>
    </div>

    {/* 站点统计信息 */}
    <div className="mb-2 text-center pointer-events-auto">
      <p className="text-[10px] font-medium opacity-40 dark:opacity-30 tracking-wider flex items-center justify-center gap-2" style={{ color: 'var(--foreground)' }}>
        <span>👁️ 总访问量 {visitorCount?.toLocaleString() || '--'} 次</span>
        <span className="opacity-20">|</span>
        <span>🕒 已运行 {uptime}</span>
      </p>
    </div>
  </div>
);
}
