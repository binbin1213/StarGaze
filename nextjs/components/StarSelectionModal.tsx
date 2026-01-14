'use client';

import { useState, useEffect } from 'react';
import { Search, X, User, Calendar, Ruler, GraduationCap, Film, Check } from 'lucide-react';

interface StarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (star: any) => void;
  currentPhotoName?: string;
}

export default function StarSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect,
  currentPhotoName 
}: StarSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stars, setStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadStars();
    }
  }, [isOpen]);

  const loadStars = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/api/stars`);
      const data = await response.json();
      setStars(data);
      setResults(data); // 初始显示全部
    } catch (error) {
      console.error('Failed to load stars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults(stars);
      return;
    }

    const filtered = stars.filter(star => 
      star.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (star.name_en && star.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setResults(filtered);
  }, [searchQuery, stars]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800">选择艺人关联</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          {currentPhotoName && (
            <p className="text-sm text-gray-500">
              为照片 <span className="text-blue-500 font-medium">{currentPhotoName}</span> 选择对应的艺人
            </p>
          )}
        </div>

        {/* 搜索框 */}
        <div className="p-6 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              autoFocus
              type="text"
              placeholder="搜索艺人姓名或英文名..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base text-gray-900 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-hide">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600">
              搜索结果 ({results.length} 个)
            </h3>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : results.length > 0 ? (
              results.map((star) => (
                <div 
                  key={star.id}
                  className="group relative p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all cursor-default"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-800">{star.name}</span>
                        {star.name_en && (
                          <span className="text-sm text-gray-400 italic">({star.name_en})</span>
                        )}
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-medium rounded-full border border-green-100">
                          有照片
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={14} className="text-gray-400" />
                          {star.birthday || '未知'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Ruler size={14} className="text-gray-400" />
                          {star.height ? `${star.height}cm` : '未知'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <GraduationCap size={14} className="text-gray-400" />
                          <span className="truncate">{star.university || '未知'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Film size={14} className="text-gray-400" />
                          <span className="truncate">{star.representative_works || '暂无代表作'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => onSelect(star)}
                      className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      选择关联
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <User className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-500 text-sm">未找到相关艺人</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
