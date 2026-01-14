'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getWorkerUrl } from '@/lib/config';
import AdminLayout from '@/components/AdminLayout';
import { Settings, ShieldCheck, Globe, Save, Loader2, CheckCircle2, AlertTriangle, Trash2, Link2Off } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // 密码状态
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 站点配置状态
  const [siteSettings, setSiteSettings] = useState({
    siteName: '',
    footerText: '',
    allowDownload: true,
    statsVisible: true
  });
  const [siteLoading, setSiteLoading] = useState(true);
  const [siteSaving, setSiteSaving] = useState(false);
  const [siteSuccess, setSiteSuccess] = useState(false);

  // 危险操作状态
  const [unbindLoading, setUnbindLoading] = useState(false);
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchSettings();
  }, [isAuthenticated, isLoading, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getWorkerUrl()}/api/settings`);
      const data = await response.json();
      setSiteSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setSiteLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(false);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        const error = await response.json();
        alert(error.error || '修改密码失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSiteSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiteSaving(true);
    setSiteSuccess(false);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(siteSettings)
      });

      if (response.ok) {
        setSiteSuccess(true);
        setTimeout(() => setSiteSuccess(false), 3000);
      } else {
        alert('保存站点设置失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setSiteSaving(false);
    }
  };

  const handleUnbindAll = async () => {
    setUnbindLoading(true);
    try {
      const response = await fetch(`${getWorkerUrl()}/api/photos/unbind-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ confirm: true })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`成功解除了 ${result.count} 张照片的关联`);
        setShowUnbindConfirm(false);
      } else {
        const error = await response.json();
        alert(error.error || '解绑失败');
      }
    } catch (error) {
      alert('网络错误，请稍后重试');
    } finally {
      setUnbindLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <AdminLayout title="系统配置">
      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        
        {/* 安全设置 */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">安全设置</h2>
              <p className="text-xs sm:text-sm text-gray-500">修改管理员登录密码</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="max-w-md space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">当前密码</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base"
                placeholder="请输入旧密码"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">新密码</label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base"
                placeholder="请输入新密码"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">确认新密码</label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-base"
                placeholder="请再次输入新密码"
              />
            </div>
            
            <button
              type="submit"
              disabled={passwordLoading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                passwordSuccess 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50`}
            >
              {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : passwordSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
              {passwordSuccess ? '修改成功' : '修改密码'}
            </button>
          </form>
        </section>

        {/* 站点设置 */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">站点设置</h2>
              <p className="text-xs sm:text-sm text-gray-500">配置网站基本信息及功能开关</p>
            </div>
          </div>

          {siteLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
              <p className="text-gray-400 font-medium">正在加载配置...</p>
            </div>
          ) : (
            <form onSubmit={handleSiteSettingsSave} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">站点名称</label>
                  <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">页脚文字</label>
                  <input
                    type="text"
                    value={siteSettings.footerText}
                    onChange={(e) => setSiteSettings({ ...siteSettings, footerText: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">允许下载照片</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">开启后前台用户可下载原图</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSiteSettings({ ...siteSettings, allowDownload: !siteSettings.allowDownload })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${siteSettings.allowDownload ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${siteSettings.allowDownload ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">显示数据统计</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500">开启后首页将显示统计信息</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSiteSettings({ ...siteSettings, statsVisible: !siteSettings.statsVisible })}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${siteSettings.statsVisible ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${siteSettings.statsVisible ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={siteSaving}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                  siteSuccess 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                } disabled:opacity-50`}
              >
                {siteSaving ? <Loader2 size={18} className="animate-spin" /> : siteSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {siteSuccess ? '保存成功' : '保存站点配置'}
              </button>
            </form>
          )}
        </section>

        {/* 危险区域 */}
        <section className="bg-white border border-red-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">危险区域</h2>
              <p className="text-xs sm:text-sm text-gray-500">这些操作具有破坏性，请谨慎操作</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 border border-red-50 bg-red-50/30 rounded-2xl gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900">一键解绑所有图片</h3>
              <p className="text-xs sm:text-sm text-gray-500">解除所有照片与艺人的关联关系，照片将变为“未归类”状态</p>
            </div>
            
            <button
              onClick={() => setShowUnbindConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm shadow-red-200"
            >
              <Link2Off size={18} />
              立即执行
            </button>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={showUnbindConfirm}
        onClose={() => setShowUnbindConfirm(false)}
        onConfirm={handleUnbindAll}
        isLoading={unbindLoading}
        title="确认解绑所有图片"
        message="确定要解除所有照片与艺人的关联关系吗？此操作将使所有照片变为“未归类”状态，且不可直接撤销。"
        confirmText="确认解绑"
        type="danger"
      />
    </AdminLayout>
  );
}
