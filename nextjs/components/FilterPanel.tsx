'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, Search } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  onClearFilters: () => void;
  currentFilters: any;
}

export default function FilterPanel({ isOpen, onClose, onApplyFilters, onClearFilters, currentFilters }: FilterPanelProps) {
  const [ageRange, setAgeRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [heightRange, setHeightRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [universities, setUniversities] = useState<string[]>([]);
  const [birthMonths, setBirthMonths] = useState<number[]>([]);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState<string>('');

  const [sections, setSections] = useState({
    age: true,
    height: true,
    education: false,
    personal: false,
    advanced: false,
  });

  // Sync with currentFilters when opened
  useEffect(() => {
    if (isOpen) {
      // 禁止背景页面滚动
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      if (currentFilters) {
        setAgeRange(currentFilters.ageRange || { min: null, max: null });
        setHeightRange(currentFilters.heightRange || { min: null, max: null });
        setUniversities(currentFilters.universities || []);
        setBirthMonths(currentFilters.birthMonths || []);
        setDegrees(currentFilters.degrees || []);
        setTags(currentFilters.tags || []);
        setKeyword(currentFilters.keyword || '');
      }

      return () => {
        // 恢复背景页面滚动
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, currentFilters]);

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApply = () => {
    onApplyFilters({
      ageRange,
      heightRange,
      universities,
      birthMonths,
      degrees,
      tags,
      keyword,
    });
    onClose();
  };

  const handleClear = () => {
    setAgeRange({ min: null, max: null });
    setHeightRange({ min: null, max: null });
    setUniversities([]);
    setBirthMonths([]);
    setDegrees([]);
    setTags([]);
    setKeyword('');
    onClearFilters();
  };

  if (!isOpen) return null;

  const universitiesOptions = ['孔敬大学', '朱拉隆功大学', '玛希隆大学', '清迈大学', '法政大学', '农业大学', '艺术大学', '其他'];
  const tagOptions = ['演员', '歌手', '模特', '主持人', '其他'];
  const ageQuickOptions = [
    { label: '15-25岁', min: 15, max: 25 },
    { label: '20-30岁', min: 20, max: 30 },
    { label: '25-35岁', min: 25, max: 35 },
    { label: '30-40岁', min: 30, max: 40 },
  ];
  const heightQuickOptions = [
    { label: '165-175cm', min: 165, max: 175 },
    { label: '170-180cm', min: 170, max: 180 },
    { label: '175-185cm', min: 175, max: 185 },
    { label: '180-190cm', min: 180, max: 190 },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-6 md:p-4 animate-in fade-in duration-300">
      <div 
        className="rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border transition-all duration-300"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--card-border)',
          color: 'var(--foreground)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <Filter size={22} className="text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight">筛选条件</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all opacity-40 hover:opacity-100"
            style={{ backgroundColor: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 dark:bg-transparent custom-scrollbar overscroll-contain" style={{ backgroundColor: 'var(--background)' }}>
          {/* 年龄范围 */}
          <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <button 
              onClick={() => toggleSection('age')}
              className="w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--section-header-bg)',
                color: 'var(--foreground)' 
              }}
            >
              <span className="font-bold text-sm">年龄范围</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${sections.age ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${sections.age ? 'max-h-[500px] border-t' : 'max-h-0'} overflow-hidden`} style={{ borderColor: 'var(--card-border)' }}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium ml-1" style={{ color: 'var(--btn-text)', opacity: 0.6 }}>最小年龄</label>
                    <input 
                      type="number"
                      placeholder="18"
                      min="0"
                      max="120"
                      value={ageRange.min || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        if (val !== null && (val < 0 || val > 120)) return;
                        setAgeRange(prev => ({ ...prev, min: val }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-base font-medium border outline-none transition-all focus:border-blue-500"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)', 
                        borderColor: 'var(--btn-border)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium ml-1" style={{ color: 'var(--btn-text)', opacity: 0.6 }}>最大年龄</label>
                    <input 
                      type="number"
                      placeholder="35"
                      min="0"
                      max="120"
                      value={ageRange.max || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        if (val !== null && (val < 0 || val > 120)) return;
                        setAgeRange(prev => ({ ...prev, max: val }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-base font-medium border outline-none transition-all focus:border-blue-500"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)', 
                        borderColor: 'var(--btn-border)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ageQuickOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setAgeRange({ min: opt.min, max: opt.max })}
                      className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border hover:opacity-80"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)',
                        borderColor: 'var(--btn-border)',
                        color: 'var(--btn-text)'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 身高范围 */}
          <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <button 
              onClick={() => toggleSection('height')}
              className="w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--section-header-bg)',
                color: 'var(--foreground)' 
              }}
            >
              <span className="font-bold text-sm">身高范围 (cm)</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${sections.height ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${sections.height ? 'max-h-[500px] border-t' : 'max-h-0'} overflow-hidden`} style={{ borderColor: 'var(--card-border)' }}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium ml-1" style={{ color: 'var(--btn-text)', opacity: 0.6 }}>最小身高 (cm)</label>
                    <input 
                      type="number"
                      placeholder="170"
                      min="0"
                      max="300"
                      value={heightRange.min || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        if (val !== null && (val < 0 || val > 300)) return;
                        setHeightRange(prev => ({ ...prev, min: val }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-base font-medium border outline-none transition-all focus:border-blue-500"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)', 
                        borderColor: 'var(--btn-border)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium ml-1" style={{ color: 'var(--btn-text)', opacity: 0.6 }}>最大身高 (cm)</label>
                    <input 
                      type="number"
                      placeholder="190"
                      min="0"
                      max="300"
                      value={heightRange.max || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        if (val !== null && (val < 0 || val > 300)) return;
                        setHeightRange(prev => ({ ...prev, max: val }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-base font-medium border outline-none transition-all focus:border-blue-500"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)', 
                        borderColor: 'var(--btn-border)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {heightQuickOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setHeightRange({ min: opt.min, max: opt.max })}
                      className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border hover:opacity-80"
                      style={{ 
                        backgroundColor: 'var(--btn-bg)',
                        borderColor: 'var(--btn-border)',
                        color: 'var(--btn-text)'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 教育信息 */}
          <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <button 
              onClick={() => toggleSection('education')}
              className="w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--section-header-bg)',
                color: 'var(--foreground)' 
              }}
            >
              <span className="font-bold text-sm">教育信息</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${sections.education ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${sections.education ? 'max-h-[500px] border-t' : 'max-h-0'} overflow-hidden`} style={{ borderColor: 'var(--card-border)' }}>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {universitiesOptions.map(uni => {
                    const isSelected = universities.includes(uni);
                    return (
                      <button
                        key={uni}
                        onClick={() => setUniversities(prev => isSelected ? prev.filter(u => u !== uni) : [...prev, uni])}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                            : 'hover:opacity-80'
                        }`}
                        style={!isSelected ? { 
                          backgroundColor: 'var(--btn-bg)',
                          borderColor: 'var(--btn-border)',
                          color: 'var(--btn-text)'
                        } : {}}
                      >
                        {uni}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 个人信息 (标签) */}
          <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <button 
              onClick={() => toggleSection('personal')}
              className="w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--section-header-bg)',
                color: 'var(--foreground)' 
              }}
            >
              <span className="font-bold text-sm">个人信息</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${sections.personal ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${sections.personal ? 'max-h-[500px] border-t' : 'max-h-0'} overflow-hidden`} style={{ borderColor: 'var(--card-border)' }}>
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {tagOptions.map(tag => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => setTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-md'
                            : 'hover:opacity-80'
                        }`}
                        style={!isSelected ? { 
                          backgroundColor: 'var(--btn-bg)',
                          borderColor: 'var(--btn-border)',
                          color: 'var(--btn-text)'
                        } : {}}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 高级搜索 (关键字) */}
          <div className="border rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <button 
              onClick={() => toggleSection('advanced')}
              className="w-full px-5 py-4 flex items-center justify-between transition-colors hover:opacity-80"
              style={{ 
                backgroundColor: 'var(--section-header-bg)',
                color: 'var(--foreground)' 
              }}
            >
              <span className="font-bold text-sm">高级搜索</span>
              <ChevronDown size={18} className={`transition-transform duration-300 ${sections.advanced ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${sections.advanced ? 'max-h-[500px] border-t' : 'max-h-0'} overflow-hidden`} style={{ borderColor: 'var(--card-border)' }}>
              <div className="p-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="搜索姓名、作品、学校..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-base font-medium border outline-none transition-all focus:border-blue-500"
                    style={{ 
                      backgroundColor: 'var(--btn-bg)', 
                      borderColor: 'var(--btn-border)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border w-full md:w-auto order-2 md:order-1"
            style={{ 
              backgroundColor: 'var(--btn-bg)', 
              borderColor: 'var(--btn-border)',
              color: 'var(--btn-text)'
            }}
          >
            清除所有筛选
          </button>
          <div className="flex items-center gap-3 w-full md:w-auto order-1 md:order-2">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border"
              style={{ 
                backgroundColor: 'var(--btn-bg)', 
                borderColor: 'var(--btn-border)',
                color: 'var(--btn-text)'
              }}
            >
              取消
            </button>
            <button
              onClick={handleApply}
              className="flex-[2] md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/25"
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </div>

  );
}
