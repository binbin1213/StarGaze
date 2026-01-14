'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getWorkerUrl } from '@/lib/config';
import AdminLayout from '@/components/AdminLayout';
import { 
  Download, 
  Database, 
  FileJson, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  FileUp, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Calendar, 
  User, 
  Monitor, 
  Clock
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function ExportPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // 快照相关状态
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [snapshotActionId, setSnapshotActionId] = useState<number | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // 导入确认模态框状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchSnapshots();
  }, [isAuthenticated, isLoading, router]);

  const fetchSnapshots = async () => {
    setSnapshotsLoading(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/snapshots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data);
      }
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: `手动备份_${new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')}` })
      });
      if (response.ok) {
        await fetchSnapshots();
      } else {
        alert('创建快照失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const executeRestore = async () => {
    if (snapshotActionId === null) return;
    setImporting(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/snapshots/${snapshotActionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        alert('快照恢复成功');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || '恢复失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setImporting(false);
      setShowRestoreModal(false);
      setSnapshotActionId(null);
    }
  };

  const executeDelete = async () => {
    if (snapshotActionId === null) return;
    try {
      const response = await fetch(`${getWorkerUrl()}/api/snapshots/${snapshotActionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        await fetchSnapshots();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setShowDeleteModal(false);
      setSnapshotActionId(null);
    }
  };

  const handleDownloadSnapshot = async (id: number, name: string) => {
    try {
      const response = await fetch(`${getWorkerUrl()}/api/snapshots/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${name}_${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('下载失败');
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    setSuccess(false);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thai-stars-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('导出失败，请重试');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowImportModal(true);
    e.target.value = ''; 
  };

  const executeImport = async () => {
    if (!pendingFile) return;

    setImporting(true);
    setImportSuccess(false);

    try {
      const text = await pendingFile.text();
      const data = JSON.parse(text);

      const response = await fetch(`${getWorkerUrl()}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || '恢复成功');
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || '导入失败');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('解析备份文件失败，请确保文件格式正确');
    } finally {
      setImporting(false);
      setPendingFile(null);
      setShowImportModal(false);
    }
  };

  return (
    <AdminLayout 
      title="数据备份与恢复" 
    >
      <div className="space-y-6 sm:space-y-8">
        {/* 核心操作卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* JSON 导出 */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <FileJson size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">导出为 JSON</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              包含完整的艺人资料、教育背景及照片元数据。最适合用于系统迁移或完整数据恢复。
            </p>
            <button
              onClick={handleExportJSON}
              disabled={exporting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                success 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              } disabled:opacity-50`}
            >
              {exporting ? <Loader2 size={20} className="animate-spin" /> : success ? <CheckCircle2 size={20} /> : <Download size={20} />}
              {success ? '导出成功' : '立即导出 JSON'}
            </button>
          </div>

          {/* JSON 导入 */}
          <div className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <FileUp size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">从 JSON 恢复</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              上传之前导出的 JSON 备份文件以恢复数据。该操作将覆盖具有相同 ID 的现有记录。
            </p>
            <label className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all cursor-pointer ${
              importSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98]'
            } ${importing ? 'opacity-50 cursor-wait' : ''}`}>
              {importing ? <Loader2 size={20} className="animate-spin" /> : importSuccess ? <CheckCircle2 size={20} /> : <Upload size={20} />}
              {importSuccess ? '恢复成功' : '上传备份文件'}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportJSON}
                disabled={importing}
              />
            </label>
          </div>
        </div>

        {/* 数据库快照部分 */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">数据库快照</h3>
                <p className="text-sm text-gray-500">存储在服务器上的秒级备份记录</p>
              </div>
            </div>
            <button
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {creatingSnapshot ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              创建新快照
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            {snapshotsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-400 font-medium">加载备份记录...</p>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database size={32} />
                </div>
                <p className="text-gray-500 font-medium">暂无备份记录</p>
              </div>
            ) : (
              <>
                {/* 移动端卡片视图 */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate mb-1">{snapshot.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar size={12} />
                            {new Date(snapshot.created_at).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleDownloadSnapshot(snapshot.id, snapshot.name)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSnapshotActionId(snapshot.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-gray-50/50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                            <User size={14} />
                          </div>
                          <div className="text-xs">
                            <div className="font-bold text-gray-700">{snapshot.creator || '系统'}</div>
                            <div className="text-gray-400 flex items-center gap-1">
                              <Monitor size={10} />
                              {snapshot.ip}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSnapshotActionId(snapshot.id);
                            setShowRestoreModal(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.95]"
                        >
                          <RotateCcw size={14} />
                          恢复
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 桌面端表格视图 */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">备份名称</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">时间</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">操作人 / IP</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {snapshots.map((snapshot) => (
                        <tr key={snapshot.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">{snapshot.name}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              {new Date(snapshot.created_at).toLocaleString('zh-CN')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <User size={14} className="text-gray-400" />
                                {snapshot.creator || '系统'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Monitor size={14} />
                                {snapshot.ip}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadSnapshot(snapshot.id, snapshot.name)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="下载 JSON"
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSnapshotActionId(snapshot.id);
                                  setShowRestoreModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold text-sm transition-all"
                              >
                                <RotateCcw size={16} />
                                恢复
                              </button>
                              <button
                                onClick={() => {
                                  setSnapshotActionId(snapshot.id);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 安全提示 */}
        <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
          <AlertCircle className="text-amber-600 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-900 mb-1">安全提示</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              导出的备份文件包含敏感的数据库结构信息，请妥善保管在安全的地方，切勿将其公开或分享给未经授权的人员。
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setPendingFile(null);
        }}
        onConfirm={executeImport}
        isLoading={importing}
        title="确认恢复数据"
        message="确定要从备份文件恢复数据吗？这将覆盖现有具有相同 ID 的记录，此操作不可撤销。"
        confirmText="确认恢复"
        type="warning"
      />

      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={executeRestore}
        isLoading={importing}
        title="确认恢复快照"
        message="确定要将数据库恢复到此快照版本吗？当前所有数据将被快照中的内容覆盖，此操作不可撤销。"
        confirmText="确认恢复"
        type="warning"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDelete}
        title="确认删除快照"
        message="确定要永久删除此备份记录吗？删除后将无法通过此快照恢复数据。"
        confirmText="确认删除"
        type="danger"
      />
    </AdminLayout>
  );
}
