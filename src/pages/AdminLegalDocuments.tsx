import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { FileText, Save } from 'lucide-react';

interface LegalDocument {
  document_key: string;
  content: string;
  updated_at: string;
}

export default function AdminLegalDocuments() {
  const { t, lang } = useI18n();
  const [activeDocType, setActiveDocType] = useState<'aszf' | 'privacy'>('aszf');
  const [documents, setDocuments] = useState<Record<string, string>>({
    aszf_hu: '',
    aszf_en: '',
    privacy_hu: '',
    privacy_en: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('document_key, content')
        .in('document_key', ['aszf_hu', 'aszf_en', 'privacy_hu', 'privacy_en']);

      if (error) throw error;

      const docsMap: Record<string, string> = {};
      data?.forEach((doc: LegalDocument) => {
        docsMap[doc.document_key] = doc.content;
      });

      setDocuments(docsMap);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error(t('errors.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async (docKey: string, content: string) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('legal_documents')
        .update({ 
          content, 
          updated_at: new Date().toISOString(),
          updated_by: session.user.id 
        })
        .eq('document_key', docKey);

      if (error) throw error;

      setDocuments(prev => ({ ...prev, [docKey]: content }));
      toast.success(t('admin.legal.saved_successfully'), { duration: 3000 });
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error(t('errors.failed_to_save'), { duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (docLang: 'hu' | 'en') => {
    const docKey = `${activeDocType}_${docLang}`;
    saveDocument(docKey, documents[docKey]);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">{t('common.loading')}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <FileText className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">
              {lang === 'hu' ? 'Jogi Dokumentumok' : 'Legal Documents'}
            </h1>
            <p className="text-white/60 text-sm">
              {lang === 'hu' 
                ? 'ÁSZF és Adatkezelési Tájékoztató szerkesztése' 
                : 'Edit Terms of Service and Privacy Policy'}
            </p>
          </div>
        </div>

        {/* Document Type Selection */}
        <Tabs value={activeDocType} onValueChange={(v) => setActiveDocType(v as 'aszf' | 'privacy')}>
          <TabsList className="bg-white/5">
            <TabsTrigger value="aszf" className="data-[state=active]:bg-purple-600/30">
              {lang === 'hu' ? 'Általános Szerződési Feltételek' : 'Terms and Conditions'}
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-purple-600/30">
              {lang === 'hu' ? 'Adatkezelési Tájékoztató' : 'Privacy Policy'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeDocType} className="space-y-4">
            {/* Language Tabs */}
            <Tabs defaultValue="hu">
              <TabsList className="bg-white/5">
                <TabsTrigger value="hu" className="data-[state=active]:bg-blue-600/30">
                  🇭🇺 Magyar
                </TabsTrigger>
                <TabsTrigger value="en" className="data-[state=active]:bg-blue-600/30">
                  🇬🇧 English
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hu" className="space-y-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-lg p-6 space-y-4">
                  <label className="text-white font-medium block">
                    {lang === 'hu' ? 'Magyar szöveg' : 'Hungarian content'}
                  </label>
                  <Textarea
                    value={documents[`${activeDocType}_hu`]}
                    onChange={(e) =>
                      setDocuments(prev => ({
                        ...prev,
                        [`${activeDocType}_hu`]: e.target.value
                      }))
                    }
                    className="min-h-[500px] bg-black/20 text-white border-white/10 font-mono text-sm"
                    placeholder={lang === 'hu' 
                      ? 'Ide írja be vagy másolja be a teljes magyar nyelvű dokumentumot...' 
                      : 'Paste the full Hungarian document here...'}
                  />
                  <Button
                    onClick={() => handleSave('hu')}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? (lang === 'hu' ? 'Mentés...' : 'Saving...') : (lang === 'hu' ? 'Magyar mentése' : 'Save Hungarian')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-lg p-6 space-y-4">
                  <label className="text-white font-medium block">
                    {lang === 'hu' ? 'Angol szöveg' : 'English content'}
                  </label>
                  <Textarea
                    value={documents[`${activeDocType}_en`]}
                    onChange={(e) =>
                      setDocuments(prev => ({
                        ...prev,
                        [`${activeDocType}_en`]: e.target.value
                      }))
                    }
                    className="min-h-[500px] bg-black/20 text-white border-white/10 font-mono text-sm"
                    placeholder={lang === 'hu' 
                      ? 'Ide írja be vagy másolja be a teljes angol nyelvű dokumentumot...' 
                      : 'Paste the full English document here...'}
                  />
                  <Button
                    onClick={() => handleSave('en')}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? (lang === 'hu' ? 'Mentés...' : 'Saving...') : (lang === 'hu' ? 'Angol mentése' : 'Save English')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}