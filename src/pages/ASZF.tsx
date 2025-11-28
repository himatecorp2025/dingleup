import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { supabase } from '@/integrations/supabase/client';

export default function ASZF() {
  const { t, lang } = useI18n();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const docKey = `aszf_${lang}`;
        const { data, error } = await supabase
          .from('legal_documents')
          .select('content')
          .eq('document_key', docKey)
          .single();

        if (error) throw error;
        setContent(data?.content || t('legal.aszf.content'));
      } catch (error) {
        console.error('Error loading document:', error);
        setContent(t('legal.aszf.content'));
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [lang, t]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] flex items-center justify-center">
        <div className="text-white">{t('common.loading')}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-6">
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-lg p-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">{t('legal.aszf.title')}</h1>
        <div className="text-gray-200 space-y-4 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}