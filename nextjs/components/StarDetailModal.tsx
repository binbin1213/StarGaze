'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { X, Calendar, Ruler, Weight, GraduationCap, Film, Search, Edit2, Download, Loader2, Plus, ChevronLeft, ChevronRight, Check, Star, MessageSquare, User, Send } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getWorkerUrl } from '@/lib/config';
import StarSelectionModal from './StarSelectionModal';
import StarEditModal from './StarEditModal';

interface StarDetailModalProps {
  starId: number;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function StarDetailModal({ starId, onClose, isAdmin }: StarDetailModalProps) {
  const [star, setStar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  // 滚动显示按钮逻辑
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Trigger deployment
  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000); // 1秒后消失
  };
  
  // 评论相关状态
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const scrollToComments = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchStarDetail = async () => {
    try {
      const response = await fetch(`${getWorkerUrl()}/api/stars/${starId}`);
      const data = await response.json();
      setStar(data);
      // 获取评论
      fetchComments();
    } catch (error) {
      console.error('Failed to fetch star detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${getWorkerUrl()}/api/stars/${starId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !nickname.trim()) {
      setCommentError('请填写昵称和评价内容');
      return;
    }

    setSubmittingComment(true);
    setCommentError('');

    try {
      const response = await fetch(`${getWorkerUrl()}/api/stars/${starId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, content: newComment }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewComment('');
        setCommentError('');
        // 记住昵称
        localStorage.setItem('user_nickname', nickname);
        // 刷新评论列表
        fetchComments();
      } else {
        setCommentError(data.error || '提交失败');
      }
    } catch (error) {
      setCommentError('网络错误，请稍后再试');
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    // 初始化时从本地获取昵称
    const savedNickname = localStorage.getItem('user_nickname');
    if (savedNickname) setNickname(savedNickname);
    
    fetchStarDetail();

    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/20 backdrop-blur-md">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!star) return null;

  // 计算年龄
  const calculateAge = (birthday?: string) => {
    if (!birthday) return '未知';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '未知';
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } catch (e) {
      return dateStr;
    }
  };

  const mainPhoto = star.photos && star.photos.length > 0 ? star.photos[activePhotoIndex] : null;

  const handleSetPrimary = async () => {
    if (!mainPhoto || !star) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${getWorkerUrl()}/api/photos/${mainPhoto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          is_primary: true
        }),
      });

      if (response.ok) {
        // 刷新数据
        fetchStarDetail();
        alert('已设为首图');
      } else {
        alert('设置失败');
      }
    } catch (error) {
      console.error('Failed to set primary photo:', error);
      alert('设置出错');
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    
    setDownloading(true);
    try {
      // 这里的延时是为了确保图片已经完全渲染
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const element = cardRef.current;
      
      // 临时保存原始样式以便恢复
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflowY = element.style.overflowY;
      
      // 临时隐藏不需要导出的元素以避免留白
      const noExportElements = element.querySelectorAll('.no-export');
      const originalStyles = Array.from(noExportElements).map(el => (el as HTMLElement).style.display);
      noExportElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // 临时修改样式以展开所有内容进行截图
      element.style.maxHeight = 'none';
      element.style.overflowY = 'visible';
      
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          borderRadius: '0',
          margin: '0',
        }
      });
      
      // 恢复原始样式
      element.style.maxHeight = originalMaxHeight;
      element.style.overflowY = originalOverflowY;
      noExportElements.forEach((el, i) => {
        (el as HTMLElement).style.display = originalStyles[i];
      });
      
      const link = document.createElement('a');
      link.download = `${star.name_en || star.name}-poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectStar = async (newStar: any) => {
    if (!mainPhoto) return;
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${getWorkerUrl()}/api/photos/${mainPhoto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          star_id: newStar.id
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert('关联失败');
      }
    } catch (error) {
      console.error('Failed to update photo star:', error);
      alert('关联失败');
    } finally {
      setShowSelectionModal(false);
    }
  };

  const handleUpdateStar = async (updatedData: any) => {
    if (!star) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${getWorkerUrl()}/api/stars/${star.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        // 刷新当前艺人数据
        fetchStarDetail();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Failed to update star:', error);
      throw error;
    }
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !star) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('star_id', star.id.toString());

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${getWorkerUrl()}/api/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (response.ok) {
        // 刷新数据以显示新上传的照片
        const res = await fetch(`${getWorkerUrl()}/api/stars/${star.id}`);
        const newData = await res.json();
        setStar(newData);
        // 设置为第一张（因为后端是 DESC 排序，第一张就是最新的）
        setActivePhotoIndex(0);
      } else {
        alert('上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错');
    } finally {
      setUploading(false);
      // 清空 input 方便下次上传同一张图
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-900/40 backdrop-blur-sm overflow-hidden p-6 sm:p-4">
      <div 
        className="fixed inset-0 cursor-pointer" 
        onClick={onClose} 
      />
      <div 
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onScroll={handleScroll}
        className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide z-10 group border border-gray-100"
      >
        {/* 操作按钮 - 固定在详情模态框的右侧，不随内容滚动 */}
        <div className="absolute top-40 right-6 z-50 flex flex-col space-y-3 no-export pointer-events-none">
          <div className={`flex flex-col space-y-3 transition-all duration-500 pointer-events-auto ${
            isHovered || isScrolling ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            <button 
              onClick={scrollToComments}
              className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-blue-500 transition-all shadow-xl border border-white/10 relative group"
              title="查看评价"
            >
              <MessageSquare size={20} strokeWidth={2.5} />
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-sm ring-2 ring-white/10">
                  {comments.length}
                </span>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDirectUpload}
              accept="image/*"
              className="hidden"
            />
            {isAdmin && (
              <>
                <button 
                  onClick={handleSetPrimary}
                  className={`p-3 backdrop-blur-xl rounded-full transition-all shadow-xl border ${
                    mainPhoto?.is_primary 
                      ? 'bg-yellow-500 text-white border-yellow-400 ring-4 ring-yellow-500/20' 
                      : 'bg-white/10 text-white border-white/10 hover:bg-yellow-500 hover:border-yellow-400'
                  }`}
                  title={mainPhoto?.is_primary ? "当前已是首图" : "设为首图"}
                >
                  <Star size={20} strokeWidth={2.5} fill={mainPhoto?.is_primary ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-emerald-500 transition-all shadow-xl border border-white/10"
                  title="添加照片"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={2.5} />}
                </button>
                <button 
                  onClick={() => setShowSelectionModal(true)}
                  className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-blue-500 transition-all shadow-xl border border-white/10"
                  title="重新关联艺人"
                >
                  <Search size={20} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-orange-500 transition-all shadow-xl border border-white/10"
                  title="编辑艺人资料"
                >
                  <Edit2 size={20} strokeWidth={2.5} />
                </button>
              </>
            )}
            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-full hover:bg-blue-500 transition-all shadow-xl border border-white/10"
              title="保存分享海报"
            >
              {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* 顶部图片区域 */}
        <div className="relative h-[560px] w-full overflow-hidden">
          {mainPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={mainPhoto.id}
              src={`${getWorkerUrl()}/images/${mainPhoto.id}`}
              alt={star.name}
              className={`w-full h-full object-cover object-top transition-all duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
              crossOrigin="anonymous"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <span className="text-gray-400 font-medium">暂无照片</span>
            </div>
          )}
          
          {/* 渐变遮罩 - 极致细腻 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />

          {/* 右上角关闭按钮 - 常驻且明显 */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-black/10 backdrop-blur-xl text-white rounded-full hover:bg-white hover:text-gray-900 transition-all shadow-lg border border-white/10 z-30 no-export"
            title="关闭 (Esc)"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* 左右导航箭头 - 现代化胶囊感 */}
          {star.photos && star.photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === 0 ? star.photos.length - 1 : prev - 1));
                }}
                className={`absolute left-4 bottom-6 p-2 bg-white/5 hover:bg-white/30 backdrop-blur-2xl text-white rounded-full transition-all duration-500 no-export z-20 group/btn border border-white/5 ${
                  isHovered || isScrolling ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                title="上一张"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((prev) => (prev === star.photos.length - 1 ? 0 : prev + 1));
                }}
                className={`absolute right-4 bottom-6 p-2 bg-white/5 hover:bg-white/30 backdrop-blur-2xl text-white rounded-full transition-all duration-500 no-export z-20 group/btn border border-white/5 ${
                  isHovered || isScrolling ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
                title="下一张"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* 图片轮播指示器 - 胶囊点状 */}
          {star.photos && star.photos.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 no-export z-20">
              {star.photos.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === activePhotoIndex ? 'bg-white w-8 shadow-lg' : 'bg-white/40 w-1.5 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 详细信息区域 */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          {/* 姓名多维信息 - 严格对齐版 */}
          <div className="space-y-6 pb-6 border-b border-gray-100">
            {/* 第一排：主姓名 (英文 & 中文) */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-80">English Name</p>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight truncate leading-tight">
                  {star.name_en || '---'}
                </h2>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80">Chinese Name</p>
                <p className="text-2xl font-bold text-gray-800 truncate leading-tight">
                  {star.name || '---'}
                </p>
              </div>
            </div>
            
            {/* 第二排：辅助姓名 (泰文 & 昵称) */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80">Thai Name</p>
                <p className="text-sm font-semibold text-gray-500 truncate">
                  {star.thai_name || <span className="text-gray-300 font-normal italic">---（暂未公开）</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-80">Nickname</p>
                <p className="text-sm font-semibold text-gray-500 truncate">
                  {star.nickname || <span className="text-gray-300 font-normal italic">---（暂未公开）</span>}
                </p>
              </div>
            </div>
          </div>

          {/* 信息网格 */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Calendar size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none mb-1">Birthday</p>
                <p className="text-sm font-bold text-gray-700 leading-none">{formatDate(star.birthday)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Ruler size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none mb-1">Height</p>
                <p className="text-sm font-bold text-gray-700 leading-none">{star.height ? `${star.height} cm` : '未知'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <Calendar size={20} strokeWidth={2.5} className="opacity-70" fill="currentColor" fillOpacity={0.15} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none mb-1">Age</p>
                <p className="text-sm font-bold text-gray-700 leading-none">{calculateAge(star.birthday)} 岁</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <GraduationCap size={20} strokeWidth={2.5} fill="currentColor" fillOpacity={0.15} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-none mb-1">Education</p>
                <p className="text-sm font-bold text-gray-700 leading-snug break-words max-w-[140px]">{star.university || '未知'}</p>
              </div>
            </div>
          </div>

          {/* 代表作 - 采用标签化展示 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Film size={16} className="text-red-400" strokeWidth={2.5} />
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Works / 代表作</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {star.representative_works ? 
                star.representative_works.split(/[，,]/).map((w: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50/50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100/50 transition-colors hover:bg-blue-100/50">
                    {w.trim()}
                  </span>
                )) : <span className="text-sm text-gray-400">暂无</span>}
            </div>
          </div>

          {/* 辣评区域 */}
          <div className="p-5 bg-gray-50 rounded-[24px] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Comment / 评价</p>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              {star.biography || '暂无评价'}
            </p>
            {star.measurements && (
              <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center space-x-4">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Stats</span>
                <span className="text-sm font-black text-gray-500">{star.measurements}</span>
              </div>
            )}
          </div>

          {/* 用户讨论区 */}
          <div ref={commentSectionRef} className="space-y-6 pt-2 no-export">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare size={16} className="text-blue-500" strokeWidth={2.5} />
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">User Discussion / 讨论区</p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-bold rounded-full">
                {comments.length} 条
              </span>
            </div>

            {/* 发表评论表单 */}
            <form onSubmit={handleSubmitComment} className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-[150px]">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="昵称"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                  />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="说点什么吧..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
              {commentError && (
                <p className="text-[10px] font-bold text-red-400 pl-1">{commentError}</p>
              )}
            </form>

            {/* 评论列表 */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="group relative pl-4">
                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gray-100 group-hover:bg-blue-100 transition-colors" />
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-black text-gray-700">{comment.nickname}</span>
                      <span className="text-[9px] font-bold text-gray-300">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="inline-flex p-3 bg-gray-50 rounded-2xl">
                    <MessageSquare size={20} className="text-gray-200" />
                  </div>
                  <p className="text-xs font-bold text-gray-300 italic">暂无讨论，快来抢沙发吧</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <StarSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        onSelect={handleSelectStar}
        currentPhotoName={mainPhoto?.original_name}
      />
      <StarEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        star={star}
        onSave={handleUpdateStar}
      />
    </div>
  );
}
