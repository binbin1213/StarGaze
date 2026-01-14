'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { commentsApi } from '@/lib/api';
import { Trash2, Edit2, MessageSquare, Save, X, User, Clock, Globe } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function CommentsPage() {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ nickname: '', content: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadComments();
    }
  }, [isAuthenticated]);

  const loadComments = async () => {
    try {
      const { data } = await commentsApi.getAll();
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条评价吗？')) return;
    try {
      await commentsApi.delete(id);
      loadComments();
    } catch (error) {
      alert('删除失败');
    }
  };

  const startEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditData({ nickname: comment.nickname, content: comment.content });
  };

  const handleUpdate = async (id: number) => {
    try {
      await commentsApi.update(id, editData);
      setEditingId(null);
      loadComments();
    } catch (error) {
      alert('更新失败');
    }
  };

  return (
    <AdminLayout 
      title="评价管理" 
      loading={loading}
      rightElement={
        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden sm:inline">Total</span>
          <span className="text-sm font-black text-indigo-600">{comments.length}</span>
        </div>
      }
    >
      {comments.length > 0 ? (
        <div className="space-y-4">
          {/* 移动端卡片列表 */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-[1.5rem] border border-gray-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      <User size={20} className="text-indigo-600" />
                    </div>
                    <div className="overflow-hidden">
                      {editingId === comment.id ? (
                        <input
                          type="text"
                          value={editData.nickname}
                          onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                          className="w-full h-8 px-2 bg-gray-50 border border-indigo-100 rounded-lg text-base focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                      ) : (
                        <h3 className="font-bold text-gray-900 truncate">{comment.nickname}</h3>
                      )}
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight truncate">
                        {comment.star_name || '未知艺人'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingId === comment.id ? (
                      <>
                        <button onClick={() => handleUpdate(comment.id)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><Save size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 text-gray-500 rounded-xl"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(comment)} className="p-2 bg-white border border-gray-100 text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(comment.id)} className="p-2 bg-white border border-gray-100 text-rose-500 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                  {editingId === comment.id ? (
                    <textarea
                      value={editData.content}
                      onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                      className="w-full p-3 bg-white border border-indigo-100 rounded-xl text-base font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all min-h-[80px]"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{comment.content}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Globe size={12} />
                    <span className="text-[10px] font-bold tabular-nums">{comment.ip_address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold tabular-nums">
                      {new Date(comment.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 桌面端表格 */}
          <div className="hidden sm:block bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">艺人</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">用户昵称</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">IP 地址</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">评价内容</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">提交时间</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="group hover:bg-indigo-50/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-indigo-600 truncate max-w-[150px]">
                          {comment.star_name || '未知艺人'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === comment.id ? (
                          <input
                            type="text"
                            value={editData.nickname}
                            onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                            className="w-full h-8 px-2 bg-white border border-indigo-100 rounded-lg text-base focus:ring-2 focus:ring-indigo-500/20 outline-none"
                          />
                        ) : (
                          <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                            {comment.nickname}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] font-bold text-gray-400 tabular-nums">{comment.ip_address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          {editingId === comment.id ? (
                            <textarea
                              value={editData.content}
                              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                              rows={1}
                              className="w-full h-8 px-3 py-1.5 bg-white border border-indigo-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none overflow-hidden"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-2">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                          {new Date(comment.created_at).toLocaleString('zh-CN', { 
                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingId === comment.id ? (
                            <>
                              <button onClick={() => handleUpdate(comment.id)} className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all"><Save size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-all"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(comment)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 text-indigo-600 rounded-lg shadow-sm hover:border-indigo-100 hover:bg-indigo-50 hover:scale-110 transition-all"><Edit2 size={14} /></button>
                              <button onClick={() => handleDelete(comment.id)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 text-rose-500 rounded-lg shadow-sm hover:border-rose-100 hover:bg-rose-50 hover:scale-110 transition-all"><Trash2 size={14} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
          <div className="p-6 bg-gray-50 rounded-full mb-4">
            <MessageSquare size={40} className="text-gray-200" />
          </div>
          <p className="text-gray-400 font-bold">暂无用户评价</p>
        </div>
      )}
    </AdminLayout>
  );
}
