import { Camera, Image as ImageIcon, FileText, X } from 'lucide-react';

interface AttachmentMenuProps {
  onImageSelect: () => void;
  onFileSelect: () => void;
  onClose: () => void;
}

export const AttachmentMenu = ({ onImageSelect, onFileSelect, onClose }: AttachmentMenuProps) => {
  return (
    <div className="fixed inset-0 z-[10015] flex items-end justify-center" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#0F1116] rounded-t-2xl border-t border-[#D4AF37]/30 shadow-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Csatolmány</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-all"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onImageSelect();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/20 rounded-lg transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-700/30 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="font-medium text-white">Fotó / Kép</p>
              <p className="text-xs text-white/50">Galéria vagy fájlok</p>
            </div>
          </button>

          <button
            onClick={() => {
              // Camera functionality would require native API or PWA camera access
              onImageSelect();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/20 rounded-lg transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="font-medium text-white">Kamera</p>
              <p className="text-xs text-white/50">Új fotó készítése</p>
            </div>
          </button>

          <button
            onClick={() => {
              onFileSelect();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#1a1a1a]/80 border border-[#D4AF37]/20 rounded-lg transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[#8B0000]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#8B0000]" />
            </div>
            <div>
              <p className="font-medium text-white">Fájl</p>
              <p className="text-xs text-white/50">PDF, videó, audió, dokumentumok</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
