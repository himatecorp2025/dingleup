import { useI18n } from '@/i18n';

export default function Adatkezeles() {
  const { t } = useI18n();
  
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] p-6">
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl rounded-lg p-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">{t('legal.adatkezeles.title')}</h1>
        <div className="text-gray-200 space-y-4">
          <p>{t('legal.adatkezeles.content')}</p>
        </div>
      </div>
    </div>
  );
}