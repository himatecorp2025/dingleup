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
                className="bg-muted/50 hover:bg-accent/20 border border-border/50 hover:border-accent/50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="bg-muted/50 hover:bg-accent/20 border border-border/50 hover:border-accent/50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="bg-muted/50 hover:bg-accent/20 border border-border/50 hover:border-accent/50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="mailto:info@dingleup.hu" 
                className="bg-muted/50 hover:bg-accent/20 border border-border/50 hover:border-accent/50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
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
