import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { ExternalLink } from 'lucide-react';

export const DownloadLinksManager = () => {
  const { t } = useI18n();
  const [googlePlayUrl, setGooglePlayUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_download_links')
      .select('google_play_url, app_store_url')
      .single();

    if (data) {
      setGooglePlayUrl(data.google_play_url || '');
      setAppStoreUrl(data.app_store_url || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('app_download_links')
      .update({
        google_play_url: googlePlayUrl,
        app_store_url: appStoreUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000001');

    if (error) {
      toast.error(t('admin.download_links.error_saving'));
      console.error(error);
    } else {
      toast.success(t('admin.download_links.saved'));
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
        <p className="text-white/70">{t('admin.download_links.loading')}</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">
        {t('admin.download_links.title')}
      </h2>
      
      <div className="space-y-6">
        {/* Google Play URL */}
        <div>
          <label className="block text-white font-semibold mb-2">
            {t('admin.download_links.google_play_label')}
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://play.google.com/store/apps/details?id=..."
              value={googlePlayUrl}
              onChange={(e) => setGooglePlayUrl(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            {googlePlayUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(googlePlayUrl, '_blank')}
                title={t('admin.download_links.test_link')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* App Store URL */}
        <div>
          <label className="block text-white font-semibold mb-2">
            {t('admin.download_links.app_store_label')}
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://apps.apple.com/app/..."
              value={appStoreUrl}
              onChange={(e) => setAppStoreUrl(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
            {appStoreUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(appStoreUrl, '_blank')}
                title={t('admin.download_links.test_link')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {saving ? t('admin.download_links.saving') : t('admin.download_links.save')}
        </Button>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
          💡 {t('admin.download_links.info')}
        </div>
      </div>
    </div>
  );
};