import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { seedTranslationsWithAI } from '@/utils/seedTranslations';
import { toast } from 'sonner';
import { Loader2, Languages, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n';

/**
 * Utility component for admins to seed translations with AI
 * Add this to admin interface or call once from console
 */
export const TranslationSeeder: React.FC = () => {
  const { t } = useI18n();
  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState('');
  const [stats, setStats] = useState<{ total: number; pending: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Real-time subscription to translations table for instant stats updates
    const channel = supabase
      .channel('translation-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'translations'
        },
        () => {
          // Refetch stats immediately when translations table changes
          fetchStats();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Count total translations
      const { count: totalCount } = await supabase
        .from('translations')
        .select('*', { count: 'exact', head: true });

      // Count pending translations (where any language field is null except hu)
      const { count: pendingCount } = await supabase
        .from('translations')
        .select('*', { count: 'exact', head: true })
        .not('hu', 'is', null)
        .or('en.is.null,de.is.null,fr.is.null,es.is.null,it.is.null,pt.is.null,nl.is.null');

      setStats({
        total: totalCount || 0,
        pending: pendingCount || 0
      });
    } catch (error) {
      console.error('Error fetching translation stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setProgress(t('admin.translation_seeder.loading'));
    
    try {
      await seedTranslationsWithAI();
      toast.success(t('admin.translation_seeder.success'));
      setProgress(t('admin.translation_seeder.completed'));
      await fetchStats();
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error(t('admin.translation_seeder.error'));
      setProgress(t('admin.translation_seeder.error'));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="p-6 bg-background border border-border rounded-lg max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <Languages className="w-6 h-6 text-primary" />
        <h3 className="text-lg font-bold">{t('admin.translation_seeder.title')}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {t('admin.translation_seeder.description')}
      </p>

      {isLoadingStats ? (
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('admin.translation_seeder.loading_status')}</span>
        </div>
      ) : stats && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('admin.translation_seeder.total_keys')}</span>
            <span className="text-sm font-bold">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('admin.translation_seeder.translated')}</span>
            <span className="text-sm font-bold text-primary">{stats.total - stats.pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('admin.translation_seeder.remaining')}</span>
            <span className="text-sm font-bold text-orange-500">{stats.pending}</span>
          </div>
          {stats.pending === 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">{t('admin.translation_seeder.all_done')}</span>
            </div>
          )}
        </div>
      )}
      
      {progress && (
        <p className="text-sm font-medium mb-4 text-primary">
          {progress}
        </p>
      )}
      
      <Button 
        onClick={handleSeed} 
        disabled={isSeeding || (stats?.pending === 0)}
        className="w-full"
      >
        {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {stats?.pending === 0 ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('admin.translation_seeder.all_translated')}
          </>
        ) : (
          isSeeding ? t('admin.translation_seeder.in_progress') : t('admin.translation_seeder.start_button')
        )}
      </Button>
      
      {stats && stats.pending > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('admin.translation_seeder.estimated_time')}
        </p>
      )}
    </div>
  );
};
