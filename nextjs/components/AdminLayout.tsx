'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  backHref?: string;
  rightElement?: ReactNode;
  loading?: boolean;
}

export default function AdminLayout({ 
  children, 
  title, 
  backHref = '/admin', 
  rightElement,
  loading = false
}: AdminLayoutProps) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            {backHref && (
              <Link 
                href={backHref} 
                className="p-2 hover:bg-gray-50 rounded-xl transition-all group shrink-0"
              >
                <ArrowLeft size={20} className="text-gray-400 group-hover:text-gray-900 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            )}
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">
              {title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {rightElement}
            {title === '管理控制台' ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">退出登录</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
            <p className="text-gray-400 font-medium">正在加载数据...</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* 移动端底部安全区占位 */}
      <div className="h-6 sm:hidden" />
    </div>
  );
}
