import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-t border-border/50 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <img src={logo} alt="Dingle UP! Logo" className="w-24 h-24 mb-4" />
            <p className="text-white/80 mb-4 max-w-md">
              A Dingle UP! egy modern kvízjáték, ahol tesztelheted tudásod, versenyezhetsz barátaiddal és nyerhetsz értékes jutalmakat.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="relative group"
                aria-label="Facebook"
                style={{ perspective: '500px' }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-80 border-2 border-purple-500/50 shadow-lg group-hover:border-accent/70 transition-all" aria-hidden />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-black/70 to-black/90" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Facebook className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="#" 
                className="relative group"
                aria-label="Instagram"
                style={{ perspective: '500px' }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-80 border-2 border-purple-500/50 shadow-lg group-hover:border-accent/70 transition-all" aria-hidden />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-black/70 to-black/90" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Instagram className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="#" 
                className="relative group"
                aria-label="Twitter"
                style={{ perspective: '500px' }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-80 border-2 border-purple-500/50 shadow-lg group-hover:border-accent/70 transition-all" aria-hidden />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-black/70 to-black/90" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Twitter className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
              <a 
                href="mailto:info@dingleup.hu" 
                className="relative group"
                aria-label="Email"
                style={{ perspective: '500px' }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-full" style={{ transform: 'translate(2px, 2px)', filter: 'blur(3px)' }} aria-hidden />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 via-purple-600 to-purple-900 opacity-80 border-2 border-purple-500/50 shadow-lg group-hover:border-accent/70 transition-all" aria-hidden />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-black/70 to-black/90" style={{ boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3)' }} aria-hidden />
                <div className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Mail className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-accent">Gyors Linkek</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Kezdőlap
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Funkciók
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Hogyan működik?
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  GYIK
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-accent">Jogi Információk</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Adatvédelem
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Felhasználási Feltételek
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Cookie Szabályzat
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors">
                  Kapcsolat
                </a>
              </li>
              <li>
                <a href="/admin/login" className="text-white/70 hover:text-accent transition-colors">
                  Admin felület
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 text-center text-white/70 text-sm">
          <p>© {currentYear} Dingle UP! Minden jog fenntartva.</p>
          <p className="mt-2">
            Készítve ❤️-tel | Játék fejlesztés alatt
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
