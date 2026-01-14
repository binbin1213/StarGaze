'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, X } from 'lucide-react';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchEditModal({ isOpen, onClose }: BatchEditModalProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Record<number, any>>({});
  const [stars, setStars] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{ id: number, field: string, list: any[] } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPhotos();
      loadStars();
    }
  }, [isOpen]);

  const loadStars = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/api/stars`);
      const data = await response.json();
      setStars(Array.isArray(data) ? data : (data.stars || []));
    } catch (error) {
      console.error('Failed to load stars:', error);
    }
  };

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/api/photos?all=true`);
      const data = await response.json();
      
      // 处理数组和对象两种响应格式
      const photoList = Array.isArray(data) ? data : (data.photos || []);
      setPhotos(photoList);
      
      // 初始化编辑数据
      const initialEditData: Record<number, any> = {};
      photoList.forEach((photo: any) => {
        initialEditData[photo.id] = {
          chineseName: photo.chineseName || '',
          englishName: photo.englishName || '',
          tags: photo.tags || '',
        };
      });
      setEditData(initialEditData);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id: number, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));

    // 自动检索逻辑
    if (value.length >= 1 && (field === 'chineseName' || field === 'englishName')) {
      const filtered = stars.filter(star => 
        star.name.toLowerCase().includes(value.toLowerCase()) || 
        star.name_en.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      if (filtered.length > 0) {
        setSuggestions({ id, field, list: filtered });
      } else {
        setSuggestions(null);
      }
    } else {
      setSuggestions(null);
    }
  };

  const selectStar = (id: number, star: any) => {
    setEditData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        chineseName: star.name,
        englishName: star.name_en,
        // 如果 star 对象有默认标签，也可以填充
      }
    }));
    setSuggestions(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editData).map(([id, data]) => ({
        id: parseInt(id),
        ...data
      }));

      if (updates.length === 0) {
        onClose();
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/api/photos/batch-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      const result = await response.json();
      alert(`保存完成！成功更新 ${result.updated} 条记录`);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('保存过程中发生错误');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = photos.map((photo: any) => ({
      id: photo.id,
      filename: photo.filename,
      previewUrl: photo.previewUrl, // 增加预览链接，方便识别图片
      chineseName: photo.chineseName || '',
      englishName: photo.englishName || '',
      tags: photo.tags || '',
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `photo-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('数据导出成功！');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        setLoading(true);
        const updates = data.map((photo: any) => ({
          id: photo.id,
          chineseName: photo.chineseName,
          englishName: photo.englishName,
          tags: photo.tags,
        }));

        const response = await fetch(`${process.env.NEXT_PUBLIC_WORKER_URL}/api/photos/batch-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error('Batch update failed');
        
        const result = await response.json();
        setLoading(false);
        alert(`成功导入并更新 ${result.updated} 条数据！`);
        onClose();
      } catch (error) {
        setLoading(false);
        alert('导入失败：' + error);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 sm:p-4">
      <div className="bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto border border-gray-700/50">
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
            <Upload size={20} className="text-blue-400" />
            批量管理与编辑
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? '正在保存...' : '保存全部修改'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 text-green-400 px-4 py-3 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/20 text-sm"
            >
              <Download size={18} />
              导出 JSON
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-3 rounded-xl hover:bg-purple-500/20 disabled:opacity-50 transition-colors border border-purple-500/20 text-sm"
            >
              <Upload size={18} />
              导入 JSON
            </button>
          </div>

          <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-300">
                共加载 <span className="font-semibold text-white">{photos.length}</span> 张照片
                {loading && <span className="ml-2 text-blue-400 animate-pulse">正在获取最新数据...</span>}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              提示：您可以直接在下方表格中修改“中文名”、“英文名”或“标签”，修改后点击右上角“保存全部修改”即可。
            </p>
          </div>

          {!loading && photos.length > 0 && (
            <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-gray-700/50 bg-gray-900/50 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-800/80 text-gray-400 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="p-4 font-medium border-b border-gray-700 w-16">预览</th>
                    <th className="p-4 font-medium border-b border-gray-700">基本信息</th>
                    <th className="p-4 font-medium border-b border-gray-700">中文名 (可编辑)</th>
                    <th className="p-4 font-medium border-b border-gray-700">英文名 (可编辑)</th>
                    <th className="p-4 font-medium border-b border-gray-700">标签 (逗号分隔)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {photos.map((photo) => (
                    <tr key={photo.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shadow-sm group-hover:border-blue-500/50 transition-colors">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={photo.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover object-top"
                            loading="lazy"
                            onError={(e) => (e.currentTarget.src = '/placeholder.jpg')}
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">ID: {photo.id}</span>
                          <span className="text-gray-500 truncate max-w-[80px]" title={photo.filename}>{photo.filename}</span>
                        </div>
                      </td>
                      <td className="p-3 relative">
                        <input
                          type="text"
                          value={editData[photo.id]?.chineseName || ''}
                          onChange={(e) => handleFieldChange(photo.id, 'chineseName', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="未设置"
                        />
                        {suggestions?.id === photo.id && suggestions?.field === 'chineseName' && (
                          <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            {suggestions.list.map((star) => (
                              <button
                                key={star.id}
                                onClick={() => selectStar(photo.id, star)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-600 transition-colors flex flex-col"
                              >
                                <span className="text-sm text-white font-medium">{star.name}</span>
                                <span className="text-xs text-gray-400">{star.name_en}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 relative">
                        <input
                          type="text"
                          value={editData[photo.id]?.englishName || ''}
                          onChange={(e) => handleFieldChange(photo.id, 'englishName', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="未设置"
                        />
                        {suggestions?.id === photo.id && suggestions?.field === 'englishName' && (
                          <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            {suggestions.list.map((star) => (
                              <button
                                key={star.id}
                                onClick={() => selectStar(photo.id, star)}
                                className="w-full text-left px-3 py-2 hover:bg-blue-600 transition-colors flex flex-col"
                              >
                                <span className="text-sm text-white font-medium">{star.name}</span>
                                <span className="text-xs text-gray-400">{star.name_en}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={editData[photo.id]?.tags || ''}
                          onChange={(e) => handleFieldChange(photo.id, 'tags', e.target.value)}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          placeholder="标签1, 标签2..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
