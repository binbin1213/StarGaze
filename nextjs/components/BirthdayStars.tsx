'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import Image from 'next/image';
import { Cake, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { getWorkerUrl, getR2Url } from '@/lib/config';

interface Star {
  id: number;
  name: string;
  name_en: string;
  birthday: string;
  avatar_url?: string;
  photo_count: number;
  primary_photo_id?: number;
}

interface BirthdayStarsProps {
  onStarClick: (id: number) => void;
}

export default function BirthdayStars({ onStarClick }: BirthdayStarsProps) {
  const currentMonth = new Date().getMonth() + 1;

  const { data: allStars, isLoading } = useSWR<Star[]>(`${getWorkerUrl()}/api/stars`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 600000 // 10分钟内不重复请求
  });

  const stars = useMemo(() => {
    if (!allStars) return [];
    
    return allStars.filter(star => {
      if (!star.birthday) return false;
      const birthMonth = new Date(star.birthday).getMonth() + 1;
      return birthMonth === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.birthday).getDate();
      const dayB = new Date(b.birthday).getDate();
      return dayA - dayB;
    });
  }, [allStars, currentMonth]);

  if (isLoading || stars.length === 0) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23F3F4F6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='10'%3EError%3C/text%3E%3C/svg%3E`;
  };

  const getStarImageUrl = (star: Star) => {
    const workerUrl = getWorkerUrl();
    const baseUrl = workerUrl.endsWith('/api') ? workerUrl.slice(0, -4) : workerUrl;

    // 优先使用 Worker 代理的图片，因为 avatar_url 往往是私有 R2 链接，会导致 401
    if (star.primary_photo_id) {
      return `${baseUrl}/images/${star.primary_photo_id}?size=thumbnail`;
    }
    
    // 如果没有 primary_photo_id，再尝试 avatar_url (前提是它不是内部 R2 地址)
    if (star.avatar_url && !star.avatar_url.includes('r2.dev')) {
      return star.avatar_url;
    }

    // Fallback if no photo
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23F3F4F6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='10'%3ENo Photo%3C/text%3E%3C/svg%3E`;
  };

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl relative group">
            <Cake size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 hidden [[data-theme='soft']_&]:block">
              <Heart size={10} className="text-pink-400 fill-pink-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <span className="hidden [[data-theme='soft']_&]:inline text-pink-400">🎀</span>
            {currentMonth}月寿星
            <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
              Birthday
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-500">
          共 {stars.length} 位
        </div>
      </div>

      <div className="relative -mx-4 px-4 md:-mx-12 md:px-12">
        <div className="flex gap-5 overflow-x-auto hover-scrollbar pb-3">
          {stars.map((star) => {
          const birthDate = new Date(star.birthday);
          const day = birthDate.getDate();
          const age = new Date().getFullYear() - birthDate.getFullYear();

          return (
            <div
              key={star.id}
              onClick={() => onStarClick(star.id)}
              className="flex-shrink-0 w-32 group cursor-pointer"
            >
              <div 
                className="relative aspect-[3/4] rounded-2xl [[data-theme='soft']_&]:rounded-[2rem] overflow-hidden mb-2 shadow-sm group-hover:shadow-xl [[data-theme='soft']_&]:group-hover:shadow-pink-100 group-hover:-translate-y-1 transition-all duration-500 border"
                style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderColor: 'var(--card-border)' 
                }}
              >
                <Image
                  src={getStarImageUrl(star)}
                  alt={star.name}
                  fill
                  unoptimized
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  onError={handleImageError}
                />
                
                {/* 装饰性渐变 - 仅在有图片时增强对比度 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
                
                {/* 柔美模式下的悬浮爱心 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden [[data-theme='soft']_&]:flex">
                  <Heart size={40} className="text-white/40 fill-white/20 animate-ping" />
                </div>
                
                {/* 日期标签 */}
                <div className="absolute top-2 left-2 px-1.5 py-1 bg-white/95 dark:bg-black/80 backdrop-blur-md rounded-lg shadow-sm z-10">
                  <span className="text-[8px] font-black text-rose-500 leading-none block text-center uppercase">
                    {currentMonth}月
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white leading-none block text-center">
                    {day}
                  </span>
                </div>

                {/* 年龄标签 */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-rose-500/90 backdrop-blur-md rounded-full text-[9px] font-black text-white z-10">
                  {age} 岁
                </div>
              </div>
              
              <div className="px-1">
                <h3 className="text-[11px] font-black truncate group-hover:text-rose-500 transition-colors leading-tight" style={{ color: 'var(--foreground)' }}>
                  {star.name}
                </h3>
                <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 truncate uppercase tracking-tighter">
                  {star.name_en}
                </p>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
