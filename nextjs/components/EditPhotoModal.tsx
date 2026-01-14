'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { starsApi } from '@/lib/api';

interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: any;
  onSave: (id: number, data: any) => Promise<void>;
}

export default function EditPhotoModal({ isOpen, onClose, photo, onSave }: EditPhotoModalProps) {
  const [name, setName] = useState('');
  const [starId, setStarId] = useState<string>('');
  const [stars, setStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && photo) {
      setName(photo.original_name || '');
      setStarId(photo.star_id?.toString() || '');
      loadStars();
    }
  }, [isOpen, photo]);

  const loadStars = async () => {
    try {
      setLoading(true);
      const { data } = await starsApi.getAll();
      setStars(data);
    } catch (error) {
      console.error('Failed to load stars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(photo.id, {
        original_name: name,
        star_id: starId ? parseInt(starId) : null,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 sm:p-4">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white/90">编辑照片信息</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              照片名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-base text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              关联艺人
            </label>
            <select
              value={starId}
              onChange={(e) => setStarId(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-base text-white focus:outline-none focus:border-blue-500"
              disabled={loading}
            >
              <option value="">无关联</option>
              {stars.map((star) => (
                <option key={star.id} value={star.id}>
                  {star.name} {star.name_en ? `(${star.name_en})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
