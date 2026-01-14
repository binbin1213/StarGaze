'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { starsApi, photosApi } from '@/lib/api';
import Link from 'next/link';
import { Plus, Edit, Trash2, Upload, ImageIcon, Loader2 } from 'lucide-react';
import StarEditModal from '@/components/StarEditModal';

export default function StarsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stars, setStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', name_en: '', avatar: '' });
  const [editingStar, setEditingStar] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    loadStars();
  }, [isAuthenticated, isLoading, router]);

  const loadStars = async () => {
    try {
      const { data } = await starsApi.getAll();
      setStars(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stars:', error);
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await starsApi.create(formData);
      setShowForm(false);
      setFormData({ name: '', name_en: '', avatar: '' });
      loadStars();
    } catch (error: any) {
      alert(error.response?.data?.error || '创建艺人失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这位艺人吗？')) {
      return;
    }
    try {
      await starsApi.delete(id);
      loadStars();
    } catch (error: any) {
      alert(error.response?.data?.error || '删除艺人失败');
    }
  };

  const handleUpdate = async (updatedData: any) => {
    if (!editingStar) return;
    try {
      await starsApi.update(editingStar.id, updatedData);
      loadStars();
    } catch (error: any) {
      alert(error.response?.data?.error || '更新艺人失败');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-xl font-bold text-gray-800 hover:text-gray-600">
              管理后台
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">艺人管理</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            添加艺人
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">新增艺人</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">中文名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    placeholder="如：萨林"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">英文名</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="如：Sarin"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">头像</label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <ImageIcon className="text-gray-400" size={32} />
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Upload size={16} />
                          {formData.avatar ? '更换头像' : '上传头像'}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={uploadingAvatar}
                          />
                        </label>
                        {formData.avatar && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar: '' })}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            移除
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">支持 JPG, PNG, GIF。建议比例 1:1。</p>
                      <input
                        type="text"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        className="w-full p-2 text-xs border border-gray-200 rounded text-gray-400 bg-gray-50"
                        placeholder="或输入图片 URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  创建
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stars.map((star) => (
              <div key={star.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {star.avatar && (
                      <img
                        src={star.avatar}
                        alt={star.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{star.name}</h3>
                      <p className="text-sm text-gray-600">
                        {star.photo_count || 0} 张照片
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStar(star)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(star.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && stars.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p>暂无艺人。点击“添加艺人”开始创建。</p>
          </div>
        )}

        <StarEditModal
          isOpen={!!editingStar}
          onClose={() => setEditingStar(null)}
          star={editingStar}
          onSave={handleUpdate}
        />
      </main>
    </div>
  );
}
