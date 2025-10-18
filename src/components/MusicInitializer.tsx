import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface MusicInitializerProps {
  onMusicEnabled: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const MusicInitializer = ({ onMusicEnabled, audioRef }: MusicInitializerProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Automatikus zene indítás
    const tryAutoplay = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.2;
          await audioRef.current.play();
          setShow(false);
          onMusicEnabled();
        }
      } catch {
        // Autoplay blokk – nem kérünk kattintást, csendben maradunk
        setShow(false);
      }
    };

    tryAutoplay();
  }, [audioRef, onMusicEnabled]);

  const handleEnableMusic = async () => {
    localStorage.setItem('musicEnabled', 'true');
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.2;
        await audioRef.current.play();
      }
    } catch {}
    setShow(false);
    onMusicEnabled();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="w-20 h-20 mx-auto bg-accent/20 rounded-full flex items-center justify-center animate-pulse">
          <Volume2 className="w-10 h-10 text-accent" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-2">Zene a játékhoz</h2>
          <p className="text-muted-foreground">
            A legjobb játékélményért kapcsold be a háttérzenét!
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={handleEnableMusic}
          className="bg-gradient-gold text-accent-foreground hover:opacity-90 transition-all hover:scale-105 shadow-glow"
        >
          <Volume2 className="mr-2" />
          Zene bekapcsolása
        </Button>
      </div>
    </div>
  );
};

export default MusicInitializer;
