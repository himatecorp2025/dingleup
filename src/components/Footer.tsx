import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-[#0a0a2e] via-[#16213e] to-[#0f0f3d] border-t border-border/50 py-12 px-4">
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
            <p className="text-white/80 mb-4 max-w-md text-with-stroke">
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
            <h3 className="font-semibold text-lg mb-4 text-accent text-with-stroke">Gyors Linkek</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Kezdőlap
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Funkciók
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Hogyan működik?
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  GYIK
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-accent text-with-stroke">Jogi Információk</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Adatvédelem
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Felhasználási Feltételek
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Cookie Szabályzat
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Kapcsolat
                </a>
              </li>
              <li>
                <a href="/admin/login" className="text-white/70 hover:text-accent transition-colors text-with-stroke">
                  Admin felület
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-8 text-center text-white/70 text-sm">
          <p className="text-with-stroke">© {currentYear} Dingle UP! Minden jog fenntartva.</p>
          <p className="mt-2 text-with-stroke">
            Készítve ❤️-tel | Játék fejlesztés alatt
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
