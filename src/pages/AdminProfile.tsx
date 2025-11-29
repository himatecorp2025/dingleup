import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useI18n } from '@/i18n';

const AdminProfile = () => {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [lastUsernameChange, setLastUsernameChange] = useState<string | null>(null);
  
  // Username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  // PIN changing
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // Grant admin role
  const [targetUsername, setTargetUsername] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('admin.error_not_logged_in'));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, last_username_change')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserId(profile.id);
        setUsername(profile.username);
        setNewUsername(profile.username);
        setLastUsernameChange(profile.last_username_change);
      }
    } catch (error: any) {
      toast.error(t('admin.error_loading_profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
    setNewUsername(username);
  };

  const handleUsernameSave = async () => {
    if (!newUsername.trim()) {
      toast.error(t('admin.error_username_empty'));
      return;
    }

    // Check 7-day cooldown
    if (lastUsernameChange) {
      const lastChange = new Date(lastUsernameChange);
      const now = new Date();
      const daysSinceLastChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastChange < 7) {
        const daysRemaining = Math.ceil(7 - daysSinceLastChange);
        toast.error(t('admin.username_cooldown').replace('{days}', String(daysRemaining)));
        setIsEditingUsername(false);
        return;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('admin.error_not_logged_in'));
        return;
      }

      const response = await supabase.functions.invoke('update-username', {
        body: { newUsername },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || t('admin.profile.username_update_error'));
      }

      setUsername(newUsername);
      setIsEditingUsername(false);
      toast.success(t('admin.success_username_updated'));
      
      // Refresh to get new last_username_change
      await fetchProfile();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const validatePin = (pin: string): string | null => {
    if (!/^\d{6}$/.test(pin)) {
      return t('admin.profile.pin_validation_error');
    }
    return null;
  };

  const handlePinSave = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast.error(t('admin.error_all_fields_required'));
      return;
    }

    if (newPin !== confirmPin) {
      toast.error(t('admin.error_pins_not_match'));
      return;
    }

    const validationError = validatePin(newPin);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('admin.error_not_logged_in'));
        return;
      }

      const response = await supabase.functions.invoke('update-pin', {
        body: { currentPin, newPin },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || t('admin.profile.pin_update_error'));
      }

      const responseData = response.data;
      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      toast.success(t('admin.success_pin_updated'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGrantAdmin = async () => {
    if (!targetUsername.trim()) {
      toast.error(t('admin.error_enter_username'));
      return;
    }

    setIsGranting(true);
    try {
      // Find user by username
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', targetUsername.trim())
        .maybeSingle();

      if (userError || !targetUser) {
        toast.error(t('admin.error_user_not_found'));
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        toast.error(t('admin.already_admin').replace('{username}', targetUser.username));
        return;
      }

      // Grant admin role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role: 'admin'
        });

      if (insertError) {
        throw insertError;
      }

      toast.success(t('admin.grant_success').replace('{username}', targetUser.username));
      setTargetUsername('');
    } catch (error: any) {
      toast.error(error.message || t('admin.grant_error'));
    } finally {
      setIsGranting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('admin.profile.loading')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-[clamp(1rem,3vw,1.5rem)] pb-[clamp(3rem,6vw,4rem)]">
        <div>
          <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-bold">{t('admin.profile.title')}</h1>
          <p className="text-muted-foreground mt-[clamp(0.375rem,1vw,0.5rem)] text-[clamp(0.875rem,2vw,1rem)]">
            {t('admin.profile.description')}
          </p>
        </div>

        {/* Username Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('admin.profile.username_section_title')}
            </CardTitle>
            <CardDescription>
              {t('admin.profile.username_section_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.profile.current_username')}</Label>
              <div className="flex gap-2">
                <Input
                  value={isEditingUsername ? newUsername : username}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={!isEditingUsername}
                  className="flex-1"
                />
                {!isEditingUsername ? (
                  <Button onClick={handleUsernameEdit} variant="outline">
                    {t('admin.profile.edit_button')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleUsernameSave}>
                      {t('admin.profile.save_button')}
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(username);
                      }}
                      variant="ghost"
                    >
                      {t('admin.profile.cancel_button')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIN Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('admin.profile.pin_section_title')}
            </CardTitle>
            <CardDescription>
              {t('admin.profile.pin_section_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.profile.current_pin')}</Label>
              <div className="relative">
                <Input
                  type={showCurrentPin ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder={t('admin.profile.pin_placeholder')}
                  maxLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.profile.new_pin')}</Label>
              <div className="relative">
                <Input
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={t('admin.profile.pin_placeholder')}
                  maxLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.profile.confirm_pin')}</Label>
              <div className="relative">
                <Input
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder={t('admin.profile.pin_placeholder')}
                  maxLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handlePinSave} className="w-full">
              {t('admin.profile.save_pin_button')}
            </Button>
          </CardContent>
        </Card>

        {/* Grant Admin Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('admin.profile.grant_admin_section_title')}
            </CardTitle>
            <CardDescription>
              {t('admin.profile.grant_admin_section_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.profile.username_label')}</Label>
              <Input
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder={t('admin.profile.username_placeholder')}
              />
            </div>

            <Button 
              onClick={handleGrantAdmin} 
              disabled={isGranting}
              className="w-full"
            >
              {isGranting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('admin.profile.processing')}
                </span>
              ) : (
                t('admin.profile.grant_admin_button')
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
