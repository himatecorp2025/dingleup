import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { useI18n } from "@/i18n";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();

  return (
    <footer className="bg-gradient-to-br from-[#0f0033] via-[#1a0033] to-[#0f0033] border-t border-white/10 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="96"
              height="96"
              viewBox="0 0 1024 1024"
              className="mb-4"
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
            <p className="text-white/80 mb-4 max-w-md drop-shadow-lg">
              {t('landing.footer.description')}
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="relative group"
                aria-label="Facebook"
              >
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-purple-500/50 hover:shadow-purple-500/80">
                  <Facebook className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="#" 
                className="relative group"
                aria-label="Instagram"
              >
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80">
                  <Instagram className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="#" 
                className="relative group"
                aria-label="Twitter"
              >
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/80">
                  <Twitter className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="mailto:info@dingleup.com" 
                className="relative group"
                aria-label="Email"
              >
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/80">
                  <Mail className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400 drop-shadow-lg">{t('landing.footer.links_title')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_features')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_how_it_works')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-yellow-400 drop-shadow-lg">{t('landing.footer.legal_title')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_terms')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_cookies')}
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_contact')}
                </a>
              </li>
              <li>
                <a href="/admin/login" className="text-white/80 hover:text-yellow-400 transition-colors drop-shadow">
                  {t('landing.footer.link_admin')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/70 text-sm">
          <p className="drop-shadow">{t('landing.footer.copyright').replace('{year}', currentYear.toString())}</p>
          <p className="mt-2 drop-shadow">
            {t('landing.footer.made_with_love')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
