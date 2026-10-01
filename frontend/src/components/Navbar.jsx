import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, ShieldCheck, History, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isStudent, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <Link to="/" className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                SIPERPU
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  v1.1
                </span>
              </Link>
              <p className="text-xs text-slate-500 hidden sm:block">Sistem Informasi Perpustakaan</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2">
            {isStudent && (
              <>
                <Link
                  to="/catalog"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/catalog')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden md:inline">Katalog Buku</span>
                </Link>
                <Link
                  to="/my-loans"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/my-loans')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden md:inline">Riwayat Pinjam</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">Kelola Buku</span>
                </Link>
                <Link
                  to="/admin/loans"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/admin/loans')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden md:inline">Log Sirkulasi</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {isAdmin ? 'Pengurus' : `Mahasiswa (${user?.nim || '-'})`}
              </span>
            </div>

            <button
              onClick={() => logout(true)}
              title="Keluar dari sistem"
              aria-label="Keluar dari sistem"
              className="inline-flex items-center gap-1.5 px-2 md:px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
