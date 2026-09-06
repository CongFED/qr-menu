'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('staff@suoidahongiao.vn');
  const [password, setPassword] = useState('Staff@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng');
        setLoading(false);
      } else {
        window.location.href = '/staff/orders';
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-[#FF6B35] to-[#FF4500] rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-3 shadow-lg shadow-orange-500/25">
            👨‍🍳
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập Nhân viên
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Màn hình tiếp nhận & xử lý order realtime
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email nhân viên
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-[#FF5B26] focus:bg-white focus:outline-none transition-all"
              placeholder="staff@suoidahongiao.vn"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-[#FF5B26] focus:bg-white focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium text-center animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-all active:scale-98 disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang đăng nhập...' : 'VÀO MÀN HÌNH BẾP / NHÂN VIÊN →'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Tài khoản mẫu: <span className="font-mono text-slate-700">staff@suoidahongiao.vn</span> / <span className="font-mono text-slate-700">Staff@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
