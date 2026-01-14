'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length === 0) {
      alert('请拖拽图片文件');
      return;
    }

    setUploading(true);
    try {
      // 检查文件数量，如果超过1个，使用批量上传接口逻辑（由父组件处理）
      await onUpload(files);
      setIsDragOver(false);
      alert(`成功上传 ${files.length} 个文件！`);
      onClose();
    } catch (error: any) {
      alert('上传失败：' + (error.response?.data?.error || error.message || error));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        setUploading(true);
        try {
          await onUpload(Array.from(files));
          alert(`成功上传 ${files.length} 个文件！`);
          onClose();
        } catch (error: any) {
          alert('上传失败：' + (error.response?.data?.error || error.message || error));
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 sm:p-4">
      <div 
        className="rounded-2xl shadow-2xl max-w-2xl w-full border max-h-[85vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--card-border)' 
        }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Upload size={20} className="text-blue-400" />
            批量上传
          </h2>
          <button onClick={onClose} className="transition-colors opacity-40 hover:opacity-100" style={{ color: 'var(--foreground)' }}>
            <X size={24} />
          </button>
        </div>

        <div
          className={`p-12 border-2 border-dashed rounded-xl text-center transition-all duration-300 m-4 ${
            isDragOver
              ? 'border-blue-400 bg-blue-500/10'
              : 'hover:border-blue-400/50'
          }`}
          style={!isDragOver ? { 
            backgroundColor: 'var(--btn-bg)', 
            borderColor: 'var(--btn-border)' 
          } : {}}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragOver ? 'text-blue-400' : 'text-gray-400'}`} />
          <p className="text-lg mb-4 font-medium" style={{ color: isDragOver ? 'var(--blue-500)' : 'var(--foreground)' }}>
            {isDragOver ? '松开鼠标上传文件' : '拖拽照片到这里'}
          </p>
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 font-bold"
          >
            {uploading ? '上传中...' : '选择文件'}
          </button>
          <p className="text-sm mt-4 opacity-50" style={{ color: 'var(--foreground)' }}>
            支持 JPG、PNG、GIF 格式，单个文件最大 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
