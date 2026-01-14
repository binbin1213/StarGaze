'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Star, Edit, Trash2, Check, User, Heart } from 'lucide-react';
import StarDetailModal from './StarDetailModal';
import { getWorkerUrl } from '@/lib/config';

interface InfinitePhotoGridProps {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: any;
  isAdmin?: boolean;
  onReplace?: (photo: any) => void;
  onTotalChange?: (total: number) => void;
  onStarClick?: (starId: number) => void;
}

export default function InfinitePhotoGrid({
  search,
  sortBy,
  sortOrder,
  filters,
  isAdmin,
  onReplace,
  onTotalChange,
  onStarClick,
}: InfinitePhotoGridProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Selection State
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const lastParamsRef = useRef<string>('');

  const loadPhotos = useCallback(async (pageNum: number, append: boolean = false) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);
    if (sortOrder) params.append('sort_order', sortOrder);
    if (filters?.ageRange?.min) params.append('min_age', filters.ageRange.min.toString());
    if (filters?.ageRange?.max) params.append('max_age', filters.ageRange.max.toString());
    if (filters?.heightRange?.min) params.append('min_height', filters.heightRange.min.toString());
    if (filters?.heightRange?.max) params.append('max_height', filters.heightRange.max.toString());
    if (filters?.universities?.length > 0) params.append('universities', filters.universities.join(','));
    if (filters?.birthMonths?.length > 0) params.append('birth_months', filters.birthMonths.join(','));
    if (filters?.degrees?.length > 0) params.append('degrees', filters.degrees.join(','));
    if (filters?.tags?.length > 0) params.append('tags', filters.tags.join(','));
    
    params.append('page', pageNum.toString());
    params.append('limit', '20');

    const currentParams = params.toString();
    if (!append && currentParams === lastParamsRef.current) return;
    if (!append) lastParamsRef.current = currentParams;

    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${getWorkerUrl()}/api/photos?${currentParams}`;
      
      const response = await fetch(apiUrl, { 
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Handle both array (old) and object (new) responses for compatibility
      const loadedPhotos = Array.isArray(data) ? data : (data.photos || []);
      const totalCount = Array.isArray(data) ? data.length : (data.total || 0);

      if (append) {
        setPhotos(prev => [...prev, ...loadedPhotos]);
      } else {
        setPhotos(loadedPhotos);
      }

      setHasMore(loadedPhotos.length > 0);
      setTotalCount(totalCount);
      if (onTotalChange) {
        onTotalChange(totalCount);
      }
    } catch (error: any) {
      console.error('Failed to load photos:', error);
      setError(error.message || '加载照片失败，请检查网络或稍后重试');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder, filters, onTotalChange]);

  useEffect(() => {
    loadPhotos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sortBy, sortOrder, filters]);

  const handleLoadMore = useCallback(() => {
    // 只有在非加载中、有更多数据且已经加载过第一页的情况下才触发
    if (!loading && hasMore && photos.length > 0) {
      loadPhotos(page + 1, true);
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore, page, loadPhotos, photos.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [handleLoadMore, loading, hasMore]);

  const getPhotoUrl = (photo: any, size: 'thumbnail' | 'original' = 'thumbnail') => {
    const baseUrl = `${getWorkerUrl()}/images/${photo.id}`;
    return size === 'thumbnail' ? `${baseUrl}?size=thumbnail` : baseUrl;
  };

  const toggleSelection = (id: number) => {
    setSelectedPhotos(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedPhotos.length} 张照片吗？`)) return;
    
    try {
      const { photosApi } = await import('@/lib/api');
      await photosApi.batchDelete(selectedPhotos);
      alert('删除成功');
      
      setSelectedPhotos([]);
      setIsSelectionMode(false);
      setPage(1);
      loadPhotos(1);
    } catch (error: any) {
      alert('删除失败：' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {isAdmin && (
             <>
               <button 
                 onClick={() => {
                   setIsSelectionMode(!isSelectionMode);
                   setSelectedPhotos([]);
                 }}
                 className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border"
                 style={{ 
                   backgroundColor: 'var(--btn-bg)', 
                   borderColor: 'var(--btn-border)',
                   color: isSelectionMode ? '#2563eb' : 'var(--btn-text)'
                 }}
               >
                 <Edit size={14} />
                 {isSelectionMode ? '取消选择' : '批量管理'}
               </button>
               
               {isSelectionMode && selectedPhotos.length > 0 && (
                 <button
                   onClick={handleBatchDelete}
                   className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-bold shadow-lg shadow-red-100"
                 >
                   <Trash2 size={14} />
                   删除 ({selectedPhotos.length})
                 </button>
               )}
             </>
          )}
        </div>
        <p className="text-sm font-medium text-gray-400">
          共 <span className="font-bold" style={{ color: 'var(--foreground)' }}>{totalCount}</span> 张照片
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
        {photos.map((photo, index) => (
          <div
            key={`${photo.id}-${index}`}
            className="group relative flex flex-col rounded-2xl [[data-theme='soft']_&]:rounded-[2.5rem] overflow-hidden border transition-all duration-700 hover:-translate-y-1 hover:shadow-xl [[data-theme='soft']_&]:hover:shadow-pink-100"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={getPhotoUrl(photo, 'thumbnail')}
                alt={photo.star_name || 'Photo'}
                fill
                unoptimized
                priority={index < 12}
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23F3F4F6'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='10'%3E图片加载失败%3C/text%3E%3C/svg%3E`;
                }}
                onClick={() => {
                  if (!isSelectionMode) {
                    if (photo.star_id) {
                      onStarClick?.(photo.star_id);
                    } else {
                      window.open(getPhotoUrl(photo, 'original'), '_blank');
                    }
                  }
                }}
              />
              
              {/* 柔美模式下的悬浮爱心 */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden [[data-theme='soft']_&]:flex">
                <Heart size={48} className="text-white/30 fill-white/10 animate-pulse" />
              </div>
              
              {/* Bottom Gradient Overlay for Text Visibility */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

              {/* Info Area - Overlaid on Image */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 pt-10 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold truncate text-white drop-shadow-lg">
                    {photo.chineseName || photo.star_name || '未命名'}
                  </span>
                </div>
                {photo.englishName && (
                  <p className="text-white/70 text-[10px] font-bold truncate uppercase tracking-[0.15em] drop-shadow-md">
                    {photo.englishName}
                  </p>
                )}
              </div>
              
              {/* Overlays (Selection, Admin) - 保持悬浮但调整样式 */}
              <div className="absolute top-2 left-2 right-2 flex justify-end items-start pointer-events-none">
                {isSelectionMode && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(photo.id);
                    }}
                    className={`pointer-events-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedPhotos.includes(photo.id) 
                        ? 'bg-blue-500 border-blue-500 scale-110' 
                        : 'border-white/80 bg-black/20 backdrop-blur-sm'
                    }`}
                  >
                    {selectedPhotos.includes(photo.id) && <Check size={12} className="text-white" />}
                  </div>
                )}

                {!isSelectionMode && isAdmin && (
                  <div className="flex gap-1">
                    {photo.star_id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (photo.is_primary) return;
                          try {
                            const response = await fetch(`${getWorkerUrl()}/api/photos/${photo.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              },
                              body: JSON.stringify({ is_primary: true })
                            });
                            if (response.ok) {
                              loadPhotos(page); // 刷新当前页
                            }
                          } catch (error) {
                            console.error('Failed to set primary:', error);
                          }
                        }}
                      className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md shadow-sm transition-all opacity-0 group-hover:opacity-100 ${
                        photo.is_primary 
                          ? 'bg-yellow-500 text-white opacity-100' 
                          : 'bg-black/40 text-white/80 hover:bg-yellow-500 hover:text-white'
                      }`}
                      title={photo.is_primary ? "首图" : "设为首图"}
                    >
                      <Star size={14} fill={photo.is_primary ? "currentColor" : "none"} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplace?.(photo);
                    }}
                    className="pointer-events-auto p-1.5 rounded-full bg-blue-500/80 backdrop-blur-md text-white shadow-sm transition-all hover:bg-blue-600 opacity-0 group-hover:opacity-100"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        ))}
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 max-w-sm">
            <p className="text-red-400 font-medium mb-4">{error}</p>
            <button 
              onClick={() => loadPhotos(1)}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors text-sm font-bold"
            >
              重试加载
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      )}

      {!hasMore && photos.length > 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest">
            已经到底啦
          </div>
        </div>
      )}

      <div ref={loadMoreRef} className="h-8" />


    </div>
  );
}
