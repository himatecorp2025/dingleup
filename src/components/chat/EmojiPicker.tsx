import { useState } from 'react';
import { Search, SmilePlus } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Gyakori': ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '😎', '🤩', '👍', '👏'],
  'Szímos': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕'],
  'Mosolygó': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊'],
  'Kaszinó': ['🎰', '🎲', '🃏', '💰', '💎', '👑', '🏆', '🎯', '🎪', '🎭', '🎬', '🎮'],
};

// Emoji kódok autocomplete-hez
const EMOJI_SHORTCUTS: Record<string, string> = {
  ':smile:': '😊',
  ':grin:': '😀',
  ':joy:': '😂',
  ':heart:': '❤️',
  ':fire:': '🔥',
  ':thumbs:': '👍',
  ':clap:': '👏',
  ':crown:': '👑',
  ':trophy:': '🏆',
  ':money:': '💰',
  ':diamond:': '💎',
  ':slot:': '🎰',
  ':dice:': '🎲',
  ':cards:': '🃏',
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

export const getEmojiFromShortcut = (text: string): string | null => {
  const match = text.match(/:(\w+):$/);
  if (match) {
    const code = `:${match[1]}:`;
    return EMOJI_SHORTCUTS[code] || null;
  }
  return null;
};

export const getEmojiSuggestions = (text: string): Array<{code: string, emoji: string}> => {
  const match = text.match(/:(\w*)$/);
  if (!match) return [];
  
  const query = match[1].toLowerCase();
  return Object.entries(EMOJI_SHORTCUTS)
    .filter(([code]) => code.slice(1, -1).includes(query))
    .map(([code, emoji]) => ({ code, emoji }))
    .slice(0, 5);
};

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Gyakori');

  // Get recent emojis from localStorage
  const getRecentEmojis = (): string[] => {
    try {
      const recent = localStorage.getItem('recentEmojis');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  const saveRecentEmoji = (emoji: string) => {
    try {
      const recent = getRecentEmojis();
      const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, 12);
      localStorage.setItem('recentEmojis', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent emoji:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    saveRecentEmoji(emoji);
    onSelect(emoji);
  };

  const recentEmojis = getRecentEmojis();
  const categories = recentEmojis.length > 0 
    ? { 'Legutóbbiak': recentEmojis, ...EMOJI_CATEGORIES }
    : EMOJI_CATEGORIES;

  const currentEmojis = categories[activeCategory as keyof typeof categories] || [];

  return (
    <div className="fixed inset-0 z-[10015] flex items-end justify-center" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#0F1116] rounded-t-2xl border-t border-[#D4AF37]/30 shadow-2xl"
        style={{ maxHeight: '60vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D4AF37]/20">
          <SmilePlus className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white">Emoji választás</h3>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Keresés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-lg text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-[#D4AF37]/10">
          {Object.keys(categories).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-[#1a1a1a] text-white/70 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: '40vh' }}>
          <div className="grid grid-cols-6 gap-2">
            {currentEmojis.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleEmojiSelect(emoji)}
                className="aspect-square flex items-center justify-center text-2xl hover:bg-white/10 rounded-lg transition-all active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
