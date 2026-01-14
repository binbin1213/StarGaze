import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Calendar, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { photosApi } from '@/lib/api';

interface StarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  star: any;
  onSave: (updatedStar: any) => Promise<void>;
}

export default function StarEditModal({ isOpen, onClose, star, onSave }: StarEditModalProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    avatar: '',
    thai_name: '',
    nickname: '',
    birthday: '',
    height: '',
    university: '',
    major: '',
    degree: '',
    representative_works: '',
    tags: '',
    biography: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (star) {
      setFormData({
        name: star.name || '',
        name_en: star.name_en || '',
        avatar: star.avatar || '',
        thai_name: star.thai_name || '',
        nickname: star.nickname || '',
        birthday: star.birthday || '',
        height: star.height || '',
        university: star.university || '',
        major: star.major || '',
        degree: star.degree || '',
        representative_works: star.representative_works || '',
        tags: star.tags || '',
        biography: star.biography || ''
      });
    }
  }, [star]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const { data } = await photosApi.upload(uploadFormData);
      setFormData({ ...formData, avatar: data.url });
    } catch (error: any) {
      alert('上传头像失败：' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save star info:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return '根据出生日期自动计算';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} 岁`;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl my-auto relative flex flex-col max-h-[85vh]">
        {/* 头部 - 修复遮挡：改为相对定位，不使用 sticky */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">编辑明星信息</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
          {/* 头像与核心信息 */}
          <div className="bg-gray-50/50 px-5 py-4 rounded-xl border border-gray-100 mb-2">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 头像上传 */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  {formData.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                      <ImageIcon className="text-gray-400" size={32} />
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <span className="text-[10px] text-gray-400">点击按钮上传头像</span>
              </div>

              {/* 姓名信息 */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    中文名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="中文姓名"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    英文名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="English Name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                泰文名
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                value={formData.thai_name}
                onChange={(e) => setFormData({ ...formData, thai_name: e.target.value })}
                placeholder="Thai Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                昵称
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Nickname"
              />
            </div>
          </div>

          {/* 生日身高 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                生日
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="date"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                身高 (cm)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="180"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                年龄 (岁)
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs">
                {calculateAge(formData.birthday)}
              </div>
            </div>
          </div>

          {/* 教育背景 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                大学
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="毕业院校"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                专业
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="学习专业"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              学位
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              placeholder="Degree (e.g., 本科, 硕士)"
            />
          </div>

          {/* 代表作 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              代表作
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
              value={formData.representative_works}
              onChange={(e) => setFormData({ ...formData, representative_works: e.target.value })}
              placeholder="你的天空"
            />
            <p className="text-[10px] text-gray-400">用顿号 (、) 或逗号 (,) 分隔多个作品</p>
          </div>

          {/* 标签 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              标签
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="待完善"
            />
            <p className="text-[10px] text-gray-400">用顿号 (、) 或逗号 (,) 分隔多个标签</p>
          </div>

          {/* 辣评 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              辣评
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base text-gray-900 resize-none"
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="输入艺人辣评..."
            />
          </div>

          {/* 底部按钮 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors w-full sm:w-auto order-2 sm:order-1"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto order-1 sm:order-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
