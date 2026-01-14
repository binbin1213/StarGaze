'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Settings, Download, User, Filter, Upload, X, LayoutDashboard, Moon, Sun, Heart, Sparkles, ChevronUp } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import InfinitePhotoGrid from '@/components/InfinitePhotoGrid';
import StatsPanel from '@/components/StatsPanel';
import BirthdayStars from '@/components/BirthdayStars';
import FilterPanel from '@/components/FilterPanel';
import BatchEditModal from '@/components/BatchEditModal';
import UploadModal from '@/components/UploadModal';
import AdminLoginModal from '@/components/AdminLoginModal';
import EditPhotoModal from '@/components/EditPhotoModal';
import BottomNav from '@/components/BottomNav';
import StarDetailModal from '@/components/StarDetailModal';
import StarListModal from '@/components/StarListModal';
import { photosApi } from '@/lib/api';
import { getWorkerUrl } from '@/lib/config';

export default function PhotoGallery() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [selectedStarId, setSelectedStarId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'soft'>('light');
  const [filters, setFilters] = useState<any>({});
  const settingsRef = useRef<HTMLDivElement>(null);

  // 使用 SWR 获取统计数据
  const { data: stats } = useSWR(`${getWorkerUrl()}/api/stats`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1分钟内不重复请求
  });

  // 记录访问量
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('has_visited');
    if (!hasVisited) {
      fetch(`${getWorkerUrl()}/api/stats/visit`, { method: 'POST' })
        .then(() => {
          sessionStorage.setItem('has_visited', 'true');
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'soft' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    let newTheme: 'light' | 'dark' | 'soft';
    if (theme === 'light') newTheme = 'dark';
    else if (theme === 'dark') newTheme = 'soft';
    else newTheme = 'light';
    
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    const loginTime = localStorage.getItem('adminLoginTime');
    if (adminStatus === 'true' && loginTime) {
      const now = Date.now();
      if (now - parseInt(loginTime) < 24 * 60 * 60 * 1000) {
        setIsAdmin(true);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  const handleExport = () => {
    alert('导出功能已移至管理面板');
  };

  // 筛选标签汉化映射
  const FILTER_LABELS: Record<string, string> = {
    ageRange: '年龄',
    heightRange: '身高',
    universities: '大学',
    birthMonths: '生日月份',
    degrees: '学位',
    tags: '标签',
    keyword: '关键词'
  };

  const handleBatchUpload = async (files: File[]) => {
    if (files.length === 0) return;

    // 单个文件走原有逻辑，或者也可以统一走批量接口（后端已支持）
    // 为了兼容性，如果是单文件，可以保留旧逻辑，也可以统一。
    // 这里统一使用批量接口，但需要注意参数构造
    
    const formData = new FormData();
    if (files.length === 1) {
       // 兼容旧接口，使用 file 字段
       formData.append('file', files[0]);
       await photosApi.upload(formData);
    } else {
       // 新接口，使用 photos 字段
       files.forEach(file => {
         formData.append('photos', file);
       });
       await photosApi.batchUpload(formData);
    }
    
    // 刷新列表
    window.location.reload();
  };

  const handleUpdatePhoto = async (id: number, data: any) => {
    try {
      await photosApi.update(id, data);
      setEditingPhoto(null);
      // 触发 InfinitePhotoGrid 刷新会比较复杂，这里简单重载页面
      // 理想情况下应该通过 context 或 event bus 通知列表更新
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.error || '更新失败');
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'search' && value && (typeof value !== 'object' || (value as any).min !== null || (value as any).max !== null)
  ).length;

  if (!mounted) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* 氛围背景装饰 */}
      <div className="ambient-bg">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
      </div>

      {/* 侧边悬浮素材 - 柔美模式下显示 */}
      <div className="side-decoration left hidden xl:flex">
        <div className="deco-item text-4xl">🌸</div>
        <div className="deco-item text-3xl">✨</div>
        <div className="deco-item text-5xl">🎀</div>
      </div>
      <div className="side-decoration right hidden xl:flex">
        <div className="deco-item text-5xl">🧸</div>
        <div className="deco-item text-4xl">🌷</div>
        <div className="deco-item text-3xl">🤍</div>
      </div>

      {/* 顶部统一控制中心 - 极简白风格 */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 border-b ${
        theme === 'soft' ? 'border-transparent' : 'border-transparent'
      }`} 
        style={{ 
          backgroundColor: theme === 'soft' ? 'transparent' : 'var(--header-bg)',
          backdropFilter: theme === 'soft' ? 'none' : 'blur(20px)',
          borderColor: 'var(--card-border)'
        }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-20 gap-4">
            <div className="flex items-center gap-8">
              <div className="logo-wrapper active:scale-95 group relative" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                {theme === 'soft' && (
                  <div className="absolute -top-3 -left-4 animate-bounce duration-1000">
                    <Heart size={16} className="text-pink-400 fill-pink-400 opacity-60" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="logo-text bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                    {theme === 'soft' ? '🌸 StarGaze' : 'StarGaze'}
                  </span>
                  {theme === 'soft' && <Sparkles size={12} className="text-pink-400 animate-pulse" />}
                </div>
                <span className="logo-en text-gray-400">Thai Stars Gallery</span>
              </div>

              {/* 统计数据 */}
              <div className="hidden lg:flex items-center pl-8 border-l transition-opacity" style={{ borderColor: 'var(--card-border)' }}>
                <StatsPanel 
                  totalStars={stats?.totalStars}
                  totalSchools={stats?.totalSchools}
                  averageAge={stats?.averageAge}
                  variant="minimalist"
                />
              </div>
            </div>
            
            <div className="flex items-center flex-1 justify-end gap-3">
              <div className="w-64 lg:w-80 hidden md:block">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="搜索姓名、昵称、学校..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border"
                  style={{ 
                    backgroundColor: 'var(--btn-bg)', 
                    borderColor: 'var(--btn-border)',
                    color: theme === 'soft' ? '#db2777' : 'var(--btn-text)'
                  }}
                  title={
                    theme === 'light' ? '切换到深色模式' : 
                    theme === 'dark' ? '切换到柔美模式' : 
                    '切换到浅色模式'
                  }
                >
                  {theme === 'light' ? <Moon size={20} /> : 
                   theme === 'dark' ? <Heart size={20} /> : 
                   <Sun size={20} />}
                </button>

                <button 
                  onClick={() => setShowFilterPanel(true)} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm shrink-0 shadow-sm active:scale-95 border"
                  style={{ 
                    backgroundColor: 'var(--btn-bg)', 
                    borderColor: 'var(--btn-border)',
                    color: 'var(--btn-text)'
                  }}
                >
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline">筛选</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 bg-indigo-500 text-white text-[10px] rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <div className="relative flex-shrink-0" ref={settingsRef}>
                  <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className="p-2.5 rounded-xl transition-all duration-300 shadow-sm active:scale-95 border"
                    style={{ 
                      backgroundColor: 'var(--btn-bg)', 
                      borderColor: 'var(--btn-border)',
                      color: 'var(--btn-text)'
                    }}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  {showSettings && (
                    <div className="absolute right-0 mt-3 w-48 rounded-2xl shadow-xl py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 border"
                      style={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--card-border)'
                      }}>
                      <div className="px-4 py-2 border-b mb-1" style={{ borderColor: 'var(--card-border)' }}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">控制台</p>
                      </div>
                      
                      {isAdmin ? (
                        <>
                          <button onClick={() => { window.open('/admin', '_blank'); setShowSettings(false); }} className="w-full px-4 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-3 transition-colors font-bold">
                            <LayoutDashboard className="w-4 h-4" />进入管理后台
                          </button>
                          <div className="h-px my-1" style={{ backgroundColor: 'var(--card-border)' }} />
                          <button onClick={() => { setShowSettings(false); setShowBatchEdit(true); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors" style={{ color: 'var(--foreground)' }}>
                            <Download className="w-4 h-4 opacity-60" />批量编辑
                          </button>
                          <button onClick={() => { setShowSettings(false); setShowUploadModal(true); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors" style={{ color: 'var(--foreground)' }}>
                            <Upload className="w-4 h-4 opacity-60" />上传照片
                          </button>
                          <div className="h-px my-1" style={{ backgroundColor: 'var(--card-border)' }} />
                          <button onClick={() => { localStorage.removeItem('isAdmin'); localStorage.removeItem('adminLoginTime'); setIsAdmin(false); setShowSettings(false); alert('已退出管理员模式'); }} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50/50 flex items-center gap-3 transition-colors font-bold">
                            <User className="w-4 h-4" />退出登录
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setShowSettings(false); setShowLoginModal(true); }} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors" style={{ color: 'var(--foreground)' }}>
                          <User className="w-4 h-4 opacity-60" />管理员登录
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 移动端搜索栏 - 仅在移动端显示 */}
          <div className="md:hidden pb-4">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="搜索姓名、昵称、学校..."
            />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 pt-36 sm:pt-28 pb-24">
        {/* 移动端数据面板 - 视觉优化 */}
        <div className="sm:hidden mb-4 px-2">
          <StatsPanel 
            totalStars={stats?.totalStars}
            totalSchools={stats?.totalSchools}
            averageAge={stats?.averageAge}
            variant="minimalist"
          />
        </div>

        <BirthdayStars onStarClick={setSelectedStarId} />

        <div className="relative">
          {Object.entries(filters).some(([key, value]) => {
            if (!value || key === 'search') return false;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') return (value as any).min !== null || (value as any).max !== null;
            return true;
          }) && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* 已选标签展示区 */}
                <div className="flex items-center gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || key === 'search') return null;
                    
                    // 过滤掉空数组
                    if (Array.isArray(value) && value.length === 0) return null;
                    
                    // 过滤掉默认的范围对象 {min: null, max: null}
                    if (typeof value === 'object' && !Array.isArray(value)) {
                      if ((value as any).min === null && (value as any).max === null) return null;
                    }

                    // 格式化显示内容
                    let displayValue = '';
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (typeof value === 'object') {
                      const min = (value as any).min;
                      const max = (value as any).max;
                      if (min && max) displayValue = `${min}-${max}`;
                      else if (min) displayValue = `${min}+`;
                      else if (max) displayValue = `≤${max}`;
                    } else {
                      displayValue = String(value);
                    }
                    
                    const label = FILTER_LABELS[key] || key;
                    
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold whitespace-nowrap border border-blue-100 shadow-sm">
                        <span className="opacity-60">{label}:</span>
                        <span>{displayValue}</span>
                        <button onClick={() => setFilters((prev: any) => ({ ...prev, [key]: Array.isArray(value) ? [] : (typeof value === 'object' ? { min: null, max: null } : null) }))} className="hover:text-blue-800 p-0.5 ml-0.5 transition-colors">
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <InfinitePhotoGrid 
            key={`${searchQuery}-${JSON.stringify(filters)}`} 
            isAdmin={isAdmin} 
            search={searchQuery} 
            filters={filters}
            onReplace={setEditingPhoto}
            onStarClick={setSelectedStarId}
          />
        </div>
      </main>

      {/* 各类弹窗 */}
      {showFilterPanel && (
        <FilterPanel 
          isOpen={showFilterPanel}
          currentFilters={filters}
          onApplyFilters={(newFilters: any) => {
            setFilters(newFilters);
            setShowFilterPanel(false);
          }}
          onClearFilters={() => setFilters({})}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showBatchEdit && isAdmin && (
        <BatchEditModal 
          isOpen={showBatchEdit}
          onClose={() => setShowBatchEdit(false)} 
        />
      )}

      {showUploadModal && isAdmin && (
        <UploadModal 
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleBatchUpload}
        />
      )}

      {showLoginModal && (
        <AdminLoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {editingPhoto && (
        <EditPhotoModal 
          isOpen={!!editingPhoto}
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={(id: number, data: any) => handleUpdatePhoto(id, data)}
        />
      )}

      {selectedStarId && (
        <StarDetailModal 
          starId={selectedStarId}
          isAdmin={isAdmin}
          onClose={() => setSelectedStarId(null)}
        />
      )}

      {showStarsModal && (
        <StarListModal 
          isOpen={showStarsModal}
          onClose={() => setShowStarsModal(false)}
          onSelectStar={(id: number) => {
            setSelectedStarId(id);
            setShowStarsModal(false);
          }}
        />
      )}

      <BottomNav 
        isAdmin={isAdmin}
        visitorCount={stats?.visitorCount}
        onFilterClick={() => setShowFilterPanel(true)}
        onStarsClick={() => setShowStarsModal(true)}
        onUploadClick={() => isAdmin ? setShowUploadModal(true) : setShowLoginModal(true)}
        onAdminClick={() => isAdmin ? setShowBatchEdit(true) : setShowLoginModal(true)}
      />

      {/* 侧边悬浮功能区 */}
      <div className="floating-side-nav">
        <button
          onClick={scrollToTop}
          className="p-4 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 group"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            color: 'var(--foreground)'
          }}
          title="回到顶部"
        >
          <ChevronUp size={24} className="group-hover:text-rose-500 transition-colors" />
        </button>
        
        <button
          onClick={toggleTheme}
          className="p-4 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-95 group"
          style={{ 
            backgroundColor: 'var(--card-bg)', 
            borderColor: 'var(--card-border)',
            borderWidth: '1px',
            color: 'var(--foreground)'
          }}
          title="切换主题"
        >
          {theme === 'light' ? (
            <Sun size={24} className="text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon size={24} className="text-indigo-400" />
          ) : (
            <Heart size={24} className="text-pink-400 fill-pink-400" />
          )}
        </button>
      </div>
    </div>
  );
}
