import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error('Nincs admin jogosultságod');
        return;
      }

      toast.success('Sikeres bejelentkezés');
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt a bejelentkezés során');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh min-h-svh bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-primary-dark/90 to-primary-darker/90 border-2 border-primary/50 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="96"
              height="96"
              viewBox="0 0 1024 1024"
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

          {/* Title */}
          <h1 className="text-3xl font-black text-center text-foreground mb-2">
            Admin Belépés
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Csak adminisztrátorok számára
          </p>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dingleup.hu"
                  className="pl-10 bg-foreground/10 border-foreground/20 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Jelszó</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-foreground/10 border-foreground/20 text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold py-3 text-lg"
            >
              {loading ? 'Betöltés...' : 'Belépés'}
            </Button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-white/60 hover:text-white/90 text-sm transition-colors"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
