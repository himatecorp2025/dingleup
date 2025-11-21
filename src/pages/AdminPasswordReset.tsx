import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminPasswordReset = () => {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('A jelszavak nem egyeznek');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('A jelszónak legalább 8 karakter hosszúnak kell lennie');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          reset_token: resetToken,
          new_password: newPassword,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Admin jelszó sikeresen visszaállítva! Most már be tudsz jelentkezni az új jelszóval.', {
          duration: 5000,
        });
        
        // Clear form
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data?.error || 'Ismeretlen hiba');
      }
    } catch (error: any) {
      console.error('[AdminPasswordReset] Error:', error);
      toast.error(error.message || 'Hiba történt a jelszó visszaállítása során');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh min-h-svh relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0a1f] flex items-center justify-center p-4">
      {/* Animated glowing orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-50"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="96"
                height="96"
                viewBox="0 0 1024 1024"
                className="relative z-10"
              >
                <image
                  href="/logo.png"
                  x="0"
                  y="0"
                  width="1024"
                  height="1024"
                  preserveAspectRatio="xMidYMid meet"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black text-center bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Admin Jelszó Visszaállítás
          </h1>
          <p className="text-center text-white/60 mb-8 text-sm">
            Egyszeri admin jelszó reset
          </p>

          {/* Reset Form */}
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Reset Token</label>
              <div className="relative group">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  type={showToken ? "text" : "password"}
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Titkos reset token"
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Új jelszó</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Új jelszó (min. 8 karakter)"
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Új jelszó megerősítése</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Új jelszó ismét"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-400/50 focus:ring-purple-400/20 transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Jelszó visszaállítása...
                </span>
              ) : (
                'Jelszó visszaállítása'
              )}
            </Button>
          </form>

          {/* Info text */}
          <div className="mt-6 text-center text-xs text-white/40">
            Ez az oldal csak egyszeri admin jelszó visszaállításra szolgál.
            A reset token bizalmasan kezelendő.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordReset;

// Direct URL access: /admin/reset-password
