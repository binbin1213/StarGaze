'use client';

import { useEffect, useState } from 'react';

interface FooterProps {
  visitorCount?: number;
}

export default function Footer({ visitorCount }: FooterProps) {
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
    const timer = setInterval(updateUptime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="w-full pt-12 pb-24 sm:pb-12 mt-12 border-t" style={{ borderColor: 'var(--card-border)' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 py-1.5 px-6 rounded-full bg-white/5 backdrop-blur-sm border border-white/5 shadow-sm transition-all">
          <p className="text-[11px] font-medium opacity-50 dark:opacity-40 tracking-wider flex items-center gap-4" style={{ color: 'var(--foreground)' }}>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              总访问量 {typeof visitorCount === 'number' ? visitorCount.toLocaleString() : '--'} 次
            </span>
            <span className="opacity-20 text-lg font-light">|</span>
            <span className="flex items-center gap-2">
              🕒 已运行 {uptime}
            </span>
          </p>
        </div>
        
        <div className="text-[10px] opacity-30 font-medium tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
          © 2026 StarGaze • Thai Stars Gallery
        </div>
      </div>
    </footer>
  );
}
