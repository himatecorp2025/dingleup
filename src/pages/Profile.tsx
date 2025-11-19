import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameProfile } from '@/hooks/useGameProfile';
import { useWallet } from '@/hooks/useWallet';
import { useBoosterState } from '@/hooks/useBoosterState';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, LogOut, Camera, Heart, Coins, Trophy, Calendar, Zap, Crown, Settings, Globe, Edit2, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import BottomNav from '@/components/BottomNav';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { BackgroundMusicControl } from '@/components/BackgroundMusicControl';

// Available countries with their codes (all countries)
const COUNTRIES = [
  { code: 'AF', name: 'Afganisztán' },
  { code: 'AL', name: 'Albánia' },
  { code: 'DZ', name: 'Algéria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua és Barbuda' },
  { code: 'AR', name: 'Argentína' },
  { code: 'AM', name: 'Örményország' },
  { code: 'AU', name: 'Ausztrália' },
  { code: 'AT', name: 'Ausztria' },
  { code: 'AZ', name: 'Azerbajdzsán' },
  { code: 'BS', name: 'Bahama-szigetek' },
  { code: 'BH', name: 'Bahrein' },
  { code: 'BD', name: 'Banglades' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Fehéroroszország' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhután' },
  { code: 'BO', name: 'Bolívia' },
  { code: 'BA', name: 'Bosznia-Hercegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazília' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BG', name: 'Bulgária' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Zöld-foki Köztársaság' },
  { code: 'KH', name: 'Kambodzsa' },
  { code: 'CM', name: 'Kamerun' },
  { code: 'CA', name: 'Kanada' },
  { code: 'CF', name: 'Közép-afrikai Köztársaság' },
  { code: 'TD', name: 'Csád' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'Kína' },
  { code: 'CO', name: 'Kolumbia' },
  { code: 'KM', name: 'Comore-szigetek' },
  { code: 'CG', name: 'Kongó' },
  { code: 'CD', name: 'Kongói Demokratikus Köztársaság' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'HR', name: 'Horvátország' },
  { code: 'CU', name: 'Kuba' },
  { code: 'CY', name: 'Ciprus' },
  { code: 'CZ', name: 'Csehország' },
  { code: 'DK', name: 'Dánia' },
  { code: 'DJ', name: 'Dzsibuti' },
  { code: 'DM', name: 'Dominika' },
  { code: 'DO', name: 'Dominikai Köztársaság' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egyiptom' },
  { code: 'SV', name: 'Salvador' },
  { code: 'GQ', name: 'Egyenlítői-Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Észtország' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Etiópia' },
  { code: 'FJ', name: 'Fidzsi' },
  { code: 'FI', name: 'Finnország' },
  { code: 'FR', name: 'Franciaország' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Grúzia' },
  { code: 'DE', name: 'Németország' },
  { code: 'GH', name: 'Ghána' },
  { code: 'GR', name: 'Görögország' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Bissau-Guinea' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Magyarország' },
  { code: 'IS', name: 'Izland' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonézia' },
  { code: 'IR', name: 'Irán' },
  { code: 'IQ', name: 'Irak' },
  { code: 'IE', name: 'Írország' },
  { code: 'IL', name: 'Izrael' },
  { code: 'IT', name: 'Olaszország' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japán' },
  { code: 'JO', name: 'Jordánia' },
  { code: 'KZ', name: 'Kazahsztán' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'Észak-Korea' },
  { code: 'KR', name: 'Dél-Korea' },
  { code: 'KW', name: 'Kuvait' },
  { code: 'KG', name: 'Kirgizisztán' },
  { code: 'LA', name: 'Laosz' },
  { code: 'LV', name: 'Lettország' },
  { code: 'LB', name: 'Libanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Libéria' },
  { code: 'LY', name: 'Líbia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Litvánia' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'MG', name: 'Madagaszkár' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malajzia' },
  { code: 'MV', name: 'Maldív-szigetek' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Málta' },
  { code: 'MH', name: 'Marshall-szigetek' },
  { code: 'MR', name: 'Mauritánia' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MX', name: 'Mexikó' },
  { code: 'FM', name: 'Mikronézia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongólia' },
  { code: 'ME', name: 'Montenegró' },
  { code: 'MA', name: 'Marokkó' },
  { code: 'MZ', name: 'Mozambik' },
  { code: 'MM', name: 'Mianmar' },
  { code: 'NA', name: 'Namíbia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepál' },
  { code: 'NL', name: 'Hollandia' },
  { code: 'NZ', name: 'Új-Zéland' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'MK', name: 'Észak-Macedónia' },
  { code: 'NO', name: 'Norvégia' },
  { code: 'OM', name: 'Omán' },
  { code: 'PK', name: 'Pakisztán' },
  { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palesztina' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Pápua Új-Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Fülöp-szigetek' },
  { code: 'PL', name: 'Lengyelország' },
  { code: 'PT', name: 'Portugália' },
  { code: 'QA', name: 'Katar' },
  { code: 'RO', name: 'Románia' },
  { code: 'RU', name: 'Oroszország' },
  { code: 'RW', name: 'Ruanda' },
  { code: 'KN', name: 'Saint Kitts és Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent és Grenadine-szigetek' },
  { code: 'WS', name: 'Szamoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé és Príncipe' },
  { code: 'SA', name: 'Szaúd-Arábia' },
  { code: 'SN', name: 'Szenegál' },
  { code: 'RS', name: 'Szerbia' },
  { code: 'SC', name: 'Seychelle-szigetek' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Szingapúr' },
  { code: 'SK', name: 'Szlovákia' },
  { code: 'SI', name: 'Szlovénia' },
  { code: 'SB', name: 'Salamon-szigetek' },
  { code: 'SO', name: 'Szomália' },
  { code: 'ZA', name: 'Dél-afrikai Köztársaság' },
  { code: 'SS', name: 'Dél-Szudán' },
  { code: 'ES', name: 'Spanyolország' },
  { code: 'LK', name: 'Srí Lanka' },
  { code: 'SD', name: 'Szudán' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SE', name: 'Svédország' },
  { code: 'CH', name: 'Svájc' },
  { code: 'SY', name: 'Szíria' },
  { code: 'TW', name: 'Tajvan' },
  { code: 'TJ', name: 'Tádzsikisztán' },
  { code: 'TZ', name: 'Tanzánia' },
  { code: 'TH', name: 'Thaiföld' },
  { code: 'TL', name: 'Kelet-Timor' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad és Tobago' },
  { code: 'TN', name: 'Tunézia' },
  { code: 'TR', name: 'Törökország' },
  { code: 'TM', name: 'Türkmenisztán' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukrajna' },
  { code: 'AE', name: 'Egyesült Arab Emírségek' },
  { code: 'GB', name: 'Egyesült Királyság' },
  { code: 'US', name: 'Egyesült Államok' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Üzbegisztán' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VA', name: 'Vatikán' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnám' },
  { code: 'YE', name: 'Jemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
];

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { profile, loading, updateProfile, refreshProfile } = useGameProfile(userId);
  const { walletData, refetchWallet } = useWallet(userId);
  const boosterState = useBoosterState(userId);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [weeklyCorrectAnswers, setWeeklyCorrectAnswers] = useState<number>(0);
  
  // Username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  // Password fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Platform detection for conditional padding
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://');
      setIsStandalone(isPWA);
    };
    checkStandalone();
  }, []);
  
  // Auto logout on inactivity
  useAutoLogout();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  // Fetch daily correct answers
  const fetchDailyCorrectAnswers = async () => {
    if (!userId) return;

    // Calculate current day (YYYY-MM-DD UTC)
    const now = new Date();
    const currentDay = now.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_rankings' as any)
      .select('total_correct_answers')
      .eq('user_id', userId)
      .eq('day_date', currentDay);

    if (!error && data) {
      // Sum all categories for this user in current day
      const total = data.reduce((sum: number, row: any) => sum + (row.total_correct_answers || 0), 0);
      setWeeklyCorrectAnswers(total);
    } else {
      setWeeklyCorrectAnswers(0);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDailyCorrectAnswers();

      // Real-time subscription for daily_rankings updates
      const channel = supabase
        .channel('profile-daily-rankings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_rankings',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchDailyCorrectAnswers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: data.publicUrl });
      toast.success('Profilkép sikeresen feltöltve!');
    } catch (error: any) {
      toast.error('Hiba a feltöltés során: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCountryChange = async (newCountryCode: string) => {
    if (!userId) return;
    
    try {
      await updateProfile({ country_code: newCountryCode });
      toast.success('Ország sikeresen frissítve! A ranglista most az új országodhoz tartozik.');
    } catch (error) {
      console.error('Failed to update country:', error);
      toast.error('Hiba történt az ország módosítása során.');
    }
  };

  const handleUsernameEdit = () => {
    setNewUsername(profile.username);
    setIsEditingUsername(true);
  };

  const handleUsernameSave = async () => {
    if (!newUsername.trim()) {
      toast.error('A felhasználónév nem lehet üres');
      return;
    }

    // Check 7-day cooldown
    if (profile.last_username_change) {
      const lastChange = new Date(profile.last_username_change);
      const now = new Date();
      const daysSinceLastChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastChange < 7) {
        const daysRemaining = Math.ceil(7 - daysSinceLastChange);
        toast.error(`A felhasználónév módosítása csak 7 naponta lehetséges. Még ${daysRemaining} nap múlva próbálkozz újra.`);
        setIsEditingUsername(false);
        return;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nincs bejelentkezve');
        return;
      }

      const response = await supabase.functions.invoke('update-username', {
        body: { newUsername },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Felhasználónév frissítése sikertelen');
      }

      await updateProfile({ username: newUsername });
      setIsEditingUsername(false);
      toast.success('Felhasználónév sikeresen módosítva');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A jelszónak legalább 8 karakterből kell állnia';
    }
    if (!/[a-z]/.test(password)) {
      return 'A jelszónak tartalmaznia kell kisbetűt';
    }
    if (!/[A-Z]/.test(password)) {
      return 'A jelszónak tartalmaznia kell nagybetűt';
    }
    if (!/\d/.test(password)) {
      return 'A jelszónak tartalmaznia kell számot';
    }
    if (!/[@$!%*?&.]/.test(password)) {
      return 'A jelszónak tartalmaznia kell speciális karaktert (@$!%*?&.)';
    }
    return null;
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Minden jelszó mező kitöltése kötelező');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Az új jelszavak nem egyeznek');
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Nincs bejelentkezve');
        return;
      }

      const response = await supabase.functions.invoke('update-password', {
        body: { currentPassword, newPassword },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Jelszó frissítése sikertelen');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Jelszó sikeresen módosítva');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <p className="text-lg text-white">Betöltés...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]">
        <p className="text-lg text-white">Hiba a profil betöltésekor</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // SVG Icons
  const HeartIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_hsl(var(--destructive)/0.8)]" viewBox="0 0 24 24" fill="hsl(var(--foreground))" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="hsl(var(--destructive))" strokeWidth="1.5"/>
    </svg>
  );

  const CoinsIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_hsl(var(--accent)/0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="hsl(var(--foreground))" stroke="hsl(var(--accent))" strokeWidth="2.5"/>
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="hsl(var(--accent))" strokeWidth="2" opacity="0.6"/>
    </svg>
  );

  const TrophyIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_hsl(var(--success)/0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9c0 3.866 2.686 7 6 7s6-3.134 6-7V4H6v5z" fill="hsl(var(--foreground))" stroke="hsl(var(--success))" strokeWidth="2.5"/>
      <path d="M6 9H4.5C3.67157 9 3 8.32843 3 7.5V6C3 5.17157 3.67157 4.5 4.5 4.5H6" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M18 9h1.5c.8284 0 1.5-.67157 1.5-1.5V6c0-.82843-.6716-1.5-1.5-1.5H18" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="9" y="16" width="6" height="4.5" rx="1" fill="hsl(var(--foreground))" stroke="hsl(var(--success))" strokeWidth="2.5"/>
      <line x1="7" y1="21" x2="17" y2="21" stroke="hsl(var(--success))" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_hsl(var(--primary)/0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="16" rx="2" fill="hsl(var(--foreground))" stroke="hsl(var(--primary))" strokeWidth="2.5"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="hsl(var(--primary))" strokeWidth="2.5"/>
      <line x1="7" y1="3" x2="7" y2="8" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="17" y1="3" x2="17" y2="8" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="7" y="13" width="3" height="3" fill="hsl(var(--primary))" rx="1"/>
      <rect x="11" y="13" width="3" height="3" fill="hsl(var(--primary))" rx="1"/>
      <rect x="15" y="13" width="3" height="3" fill="hsl(var(--primary))" rx="1"/>
      <rect x="7" y="17" width="3" height="3" fill="hsl(var(--primary))" rx="1"/>
      <rect x="11" y="17" width="3" height="3" fill="hsl(var(--primary))" rx="1"/>
    </svg>
  );

  const ShareIcon = () => (
    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_hsl(var(--primary-glow)/0.8)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="3" fill="hsl(var(--foreground))" stroke="hsl(var(--primary-glow))" strokeWidth="2.5"/>
      <circle cx="6" cy="12" r="3" fill="hsl(var(--foreground))" stroke="hsl(var(--primary-glow))" strokeWidth="2.5"/>
      <circle cx="18" cy="19" r="3" fill="hsl(var(--foreground))" stroke="hsl(var(--primary-glow))" strokeWidth="2.5"/>
      <line x1="8.5" y1="10.5" x2="15.5" y2="6.5" stroke="hsl(var(--primary-glow))" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="8.5" y1="13.5" x2="15.5" y2="17.5" stroke="hsl(var(--primary-glow))" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  const ZapIcon = () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_2px_8px_hsl(var(--accent)/0.8)]" viewBox="0 0 24 24" fill="hsl(var(--accent))" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="hsl(var(--accent)/0.8)" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="profile-container min-h-dvh min-h-svh w-screen fixed inset-0 overflow-y-auto" style={{
      paddingTop: 'max(calc(env(safe-area-inset-top) + 2%), env(safe-area-inset-top) + 8px)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {/* Full-screen background that covers status bar */}
      <div 
        className="fixed bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d]"
        style={{
          left: 'calc(-1 * env(safe-area-inset-left, 0px))',
          right: 'calc(-1 * env(safe-area-inset-right, 0px))',
          top: 'calc(-1 * env(safe-area-inset-top, 0px))',
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))',
          width: 'calc(100vw + env(safe-area-inset-left, 0px) + env(safe-area-inset-right, 0px))',
          height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none'
        }}
      />
      
      {/* Casino lights removed per user requirement */}
      
      <div className="w-full flex flex-col px-3 py-2 max-w-screen-sm mx-auto relative z-10" style={{ paddingBottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 120px)' }}>
        {/* Header - Back button and Avatar in same line - HIGHER UP */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="relative p-3 rounded-full hover:scale-110 transition-all"
            title="Vissza a dashboardra"
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(3px, 3px)', filter: 'blur(4px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-700 via-red-600 to-red-900 border-2 border-red-400/50 shadow-lg" aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-red-600 via-red-500 to-red-800" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[5px] rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.2), inset 0 -8px 16px rgba(0,0,0,0.3)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[5px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 60% at 30% 0%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)' }} aria-hidden />
            
            {/* Icon */}
            <LogOut className="w-6 h-6 text-foreground relative z-10 -scale-x-100" />
          </button>

          {/* Avatar on the same line as back button */}
          <div className="relative" data-tutorial="profile-pic">
            <div 
              className="w-16 h-16 sm:w-20 sm:h-20 aspect-square clip-hexagon bg-gradient-to-br from-primary to-primary flex items-center justify-center border-2 sm:border-4 border-accent gold-glow
                shadow-[0_8px_24px_hsl(var(--accent)/0.6),0_0_32px_hsl(var(--accent)/0.4),inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-4px_12px_rgba(0,0,0,0.3)]
                before:absolute before:inset-0 before:clip-hexagon before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none
                after:absolute after:inset-[2px] after:clip-hexagon after:bg-gradient-to-b after:from-transparent after:to-black/20 after:pointer-events-none
                relative transform-gpu"
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-full h-full object-cover clip-hexagon"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-foreground drop-shadow-lg">
                  {getInitials(profile.username)}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-accent hover:bg-accent/90 p-1.5 sm:p-2 rounded-full border-2 border-accent transition-all gold-glow
                shadow-[0_4px_12px_hsl(var(--accent)/0.6),0_0_24px_hsl(var(--accent)/0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.3)]
                before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none
                after:absolute after:inset-[1px] after:rounded-full after:bg-gradient-to-b after:from-transparent after:to-black/20 after:pointer-events-none
                hover:shadow-[0_6px_16px_rgba(234,179,8,0.7),0_0_32px_rgba(234,179,8,0.5)]
                transform-gpu hover:scale-110"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow relative z-10" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-accent via-foreground to-accent mb-1 flex items-center justify-center gap-2">
            {profile.username}
          </h1>
          <p className="text-sm sm:text-base text-accent-light/90">{profile.email}</p>
        </div>

        {/* Stats Grid - 2x3 unified layout */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6" data-tutorial="stats">
          {/* Lives - Deep 3D */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-red-900 opacity-90 border-3 border-red-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-red-500 via-red-600 to-red-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
              <HeartIcon />
              <p className="text-xs sm:text-sm text-foreground/90 mb-1 font-semibold drop-shadow-lg">Életek</p>
              <p className="text-xl sm:text-2xl font-black text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.lives}/{profile.max_lives}</p>
            </div>
          </div>

          {/* Coins - Deep 3D */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-700 via-orange-600 to-orange-900 opacity-90 border-3 border-orange-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
              <CoinsIcon />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold drop-shadow-lg">Aranyérmék</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.coins}</p>
            </div>
          </div>

          {/* Total Correct Answers - Deep 3D */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-700 via-green-600 to-green-900 opacity-90 border-3 border-green-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-green-500 via-green-600 to-green-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
              <TrophyIcon />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold drop-shadow-lg">Aktuális Napi Helyes válaszok száma:</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{weeklyCorrectAnswers}</p>
            </div>
          </div>

          {/* Daily Streak - Deep 3D */}
          <div className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu" style={{ perspective: '1000px' }}>
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-900 opacity-90 border-3 border-blue-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
              <CalendarIcon />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold drop-shadow-lg">Napi sorozat</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.daily_gift_streak} nap</p>
            </div>
          </div>

          {/* Invitation Code Card - Deep 3D */}
          <div 
            onClick={() => {
              navigator.clipboard.writeText(profile.invitation_code || '');
              toast.success('Meghívókód vágólapra másolva!');
            }}
            className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center cursor-pointer transition-transform active:scale-95 transform-gpu hover:scale-105 hover:-translate-y-0.5"
            style={{ perspective: '1000px' }}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-90 border-3 border-purple-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-500 via-purple-600 to-purple-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10" style={{ transform: 'translateZ(40px)' }}>
              <ShareIcon />
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold drop-shadow-lg">Meghívó kód (kattints a másoláshoz)</p>
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{profile.invitation_code}</p>
            </div>
          </div>

          {/* Free Booster Card - Deep 3D */}
          <div 
            className="relative rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center transform-gpu"
            style={{ perspective: '1000px' }}
          >
            {/* BASE SHADOW */}
            <div className="absolute inset-0 bg-black/70 rounded-xl sm:rounded-2xl" style={{ transform: 'translate(6px, 6px)', filter: 'blur(8px)' }} aria-hidden />
            
            {/* OUTER FRAME */}
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-900 opacity-90 border-3 border-yellow-500/60 shadow-xl" style={{ transform: 'translateZ(0px)' }} aria-hidden />
            
            {/* MIDDLE FRAME */}
            <div className="absolute inset-[4px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-transparent to-black/70" style={{ boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.5)', transform: 'translateZ(10px)' }} aria-hidden />
            
            {/* INNER LAYER */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700" style={{ boxShadow: 'inset 0 12px 24px rgba(255,255,255,0.2), inset 0 -12px 24px rgba(0,0,0,0.3)', transform: 'translateZ(20px)' }} aria-hidden />
            
            {/* SPECULAR HIGHLIGHT */}
            <div className="absolute inset-[6px] rounded-xl sm:rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 80% at 40% 10%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 60%)', transform: 'translateZ(30px)' }} aria-hidden />
            
            {/* Content */}
            <div className="relative z-10 space-y-2" style={{ transform: 'translateZ(40px)' }}>
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 drop-shadow-[0_2px_8px_rgba(234,179,8,0.8)]" viewBox="0 0 24 24" fill="hsl(var(--foreground))" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="hsl(47, 96%, 53%)" strokeWidth="2" strokeLinejoin="round" />
              </svg>
              <p className="text-xs sm:text-sm text-white/90 mb-1 font-semibold drop-shadow-lg">Free Booster</p>
              <p className="text-[10px] sm:text-xs text-white/70 leading-tight">+300 arany<br />+15 élet<br />4× 30' Speed</p>
              {boosterState.pendingSpeedTokensCount > 0 ? (
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Speed aktiválás...', { id: 'speed-activate' });
                      const { data, error } = await supabase.functions.invoke('activate-speed-token');
                      if (error) throw error;
                      if (data?.success) {
                        toast.success(`Speed aktiválva! ${data.activeSpeedToken?.durationMinutes}' gyorsítás`, { id: 'speed-activate' });
                        refetchWallet();
                        refreshProfile();
                      }
                    } catch (e) {
                      toast.error('Hiba történt', { id: 'speed-activate' });
                    }
                  }}
                  className="w-full mt-2 px-2 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all shadow-lg"
                >
                  Aktiválom ({boosterState.pendingSpeedTokensCount} token)
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if ((walletData?.coinsCurrent || 0) < 900) {
                      toast.error('Nincs elég aranyad');
                      return;
                    }
                    try {
                      toast.loading('Vásárlás...', { id: 'free-booster' });
                      const { data, error } = await supabase.functions.invoke('purchase-booster', {
                        body: { boosterCode: 'FREE' }
                      });
                      if (error) throw error;
                      if (data?.success) {
                        toast.success(`Sikeres vásárlás! +${data.grantedRewards?.gold} arany, +${data.grantedRewards?.lives} élet`, { id: 'free-booster' });
                        refetchWallet();
                        refreshProfile();
                      }
                    } catch (e) {
                      toast.error('Hiba történt', { id: 'free-booster' });
                    }
                  }}
                  disabled={(walletData?.coinsCurrent || 0) < 900}
                  className="w-full mt-2 px-2 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {(walletData?.coinsCurrent || 0) < 900 ? 'Nincs elég aranyad' : '900 arany'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm transform-gpu">
          {/* Base shadow (3D depth) */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-black/35 blur-md" style={{ top: '3px', left: '3px', right: '-3px', bottom: '-3px' }} aria-hidden />
          
          {/* Outer frame */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-700/40 via-purple-600/30 to-purple-900/40 border-2 border-purple-500/30
            shadow-[0_0_20px_rgba(168,85,247,0.4),0_8px_25px_rgba(0,0,0,0.5)]" aria-hidden />
          
          {/* Middle frame (bright highlight) */}
          <div className="absolute inset-[3px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-purple-600/30 via-purple-500/20 to-purple-800/30"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)' }} aria-hidden />
          
          {/* Inner crystal layer */}
          <div className="absolute rounded-xl sm:rounded-2xl bg-gradient-to-b from-black/50 via-black/60 to-black/70"
            style={{ top: '5px', left: '5px', right: '5px', bottom: '5px', boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.1), inset 0 -8px 16px rgba(0,0,0,0.4)' }} aria-hidden />
          
          {/* Content */}
          <div className="relative z-10">
            <h2 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 drop-shadow-[0_2px_8px_rgba(168,85,247,0.8)]" />
              Fiók információk
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Username with edit */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Felhasználónév</p>
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="bg-black/30 border-purple-500/30 text-white"
                      maxLength={30}
                    />
                    <Button
                      size="sm"
                      onClick={handleUsernameSave}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{profile.username}</p>
                    <button
                      onClick={handleUsernameEdit}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-white/40 mt-1">A felhasználónév 7 naponta csak 1x módosítható</p>
              </div>
              
              {/* Email */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">E-mail cím</p>
                <p className="text-sm sm:text-base text-white font-bold break-all drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{profile.email}</p>
              </div>

              {/* Birth Date (read-only) */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Születési dátum</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('hu-HU') : '1991. 05. 05.'}
                </p>
              </div>

              {/* Current Password (masked) */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Jelenlegi jelszó</p>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Írd be a jelenlegi jelszavad"
                    className="bg-black/30 border-purple-500/30 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Új jelszó</p>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 karakter, kis/nagybetű, szám, spec. karakter"
                    className="bg-black/30 border-purple-500/30 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Jelszó megerősítése</p>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Írd be újra az új jelszavad"
                    className="bg-black/30 border-purple-500/30 text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Ország (Ranglista alapja)
                </p>
                <Select value={profile.country_code || 'HU'} onValueChange={handleCountryChange}>
                  <SelectTrigger className="bg-black/30 border-purple-500/30 text-white hover:border-purple-400/50 focus:border-purple-400">
                    <SelectValue placeholder="Válassz országot" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-purple-500/30 max-h-[300px] z-50">
                    {COUNTRIES.map((country) => (
                      <SelectItem 
                        key={country.code} 
                        value={country.code}
                        className="text-foreground hover:bg-accent focus:bg-accent"
                      >
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-white/40 mt-1">
                  A ranglista mindig az általad választott ország játékosait jeleníti meg.
                </p>
              </div>
              
              <div className="border-b border-purple-500/20 pb-2 sm:pb-3">
                <p className="text-xs sm:text-sm text-white/50 mb-1">Élet regeneráció</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {profile.lives_regeneration_rate} perc / 1 élet
                </p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-white/50 mb-1">Regisztráció dátuma</p>
                <p className="text-sm sm:text-base text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                  {new Date(profile.created_at).toLocaleDateString('hu-HU')}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  onClick={handlePasswordSave}
                  disabled={isSaving}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-6 rounded-lg
                    shadow-[0_4px_12px_hsl(var(--accent)/0.6),0_0_24px_hsl(var(--accent)/0.4)]
                    hover:shadow-[0_6px_16px_hsl(var(--accent)/0.7),0_0_32px_hsl(var(--accent)/0.5)]
                    transition-all transform-gpu hover:scale-[1.02]"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mentés...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Változtatások mentése
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Background Music Control - Moved below Account Info */}
        <BackgroundMusicControl />
      </div>

      <BottomNav />
      <TutorialManager route="profile" />
    </div>
  );
};

export default Profile;
