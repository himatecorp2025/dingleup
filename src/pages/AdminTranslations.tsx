import AdminLayout from '@/components/admin/AdminLayout';
import { TranslationSeeder } from '@/components/TranslationSeeder';
import { QuestionTranslationManager } from '@/components/QuestionTranslationManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/i18n';

const AdminTranslations = () => {
  const { t } = useI18n();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('admin.translations.title')}</h1>
          <p className="text-white/60">{t('admin.translations.description')}</p>
        </div>

        <Tabs defaultValue="ui" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="ui"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white"
            >
              {t('admin.translations.ui_translations')}
            </TabsTrigger>
            <TabsTrigger 
              value="questions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30 data-[state=active]:text-white"
            >
              {t('admin.translations.question_translations')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ui" className="mt-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <TranslationSeeder />
            </div>
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-6">
              <QuestionTranslationManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminTranslations;
