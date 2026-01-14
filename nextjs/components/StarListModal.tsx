'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { X, Search, User, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getWorkerUrl } from '@/lib/config';

interface Star {
  id: number;
  name: string;
  name_en: string | null;
  avatar_url: string | null;
  tags: string | null;
}

interface StarListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStar: (starId: number) => void;
}

export default function StarListModal({ isOpen, onClose, onSelectStar }: StarListModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stars = [], isLoading } = useSWR<Star[]>(
    isOpen ? `${getWorkerUrl()}/api/stars` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000 // 5分钟内不重复请求
    }
  );

  const filteredStars = useMemo(() => {
    return stars.filter(star => 
      star.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (star.name_en && star.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stars, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="text-blue-400" size={24} />
              艺人列表
            </h3>
            <p className="text-sm text-gray-400 mt-1">共 {stars.length} 位艺人</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="搜索艺人姓名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 text-base"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-500">正在加载艺人...</p>
            </div>
          ) : filteredStars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredStars.map(star => (
                <button
                  key={star.id}
                  onClick={() => onSelectStar(star.id)}
                  className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all group text-left"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                    {star.avatar_url ? (
                      <Image
                        src={star.avatar_url}
                        alt={star.name}
                        fill
                        className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <User size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{star.name}</h4>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{star.name_en || '艺人'}</p>
                    {star.tags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {star.tags.split(',').slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowRight size={18} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Search size={48} className="mb-4 opacity-20" />
              <p>未找到匹配的艺人</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
