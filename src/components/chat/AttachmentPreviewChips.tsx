import { X, Image, Video, Music, FileText, File } from 'lucide-react';
import { Attachment } from './AttachmentState';

interface AttachmentPreviewChipsProps {
  attachments: Attachment[];
  onRemove: (localId: string) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getIcon = (kind: string) => {
  switch (kind) {
    case 'image': return <Image className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'audio': return <Music className="w-4 h-4" />;
    case 'document': return <FileText className="w-4 h-4" />;
    default: return <File className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'uploaded': return 'border-[#138F5E]';
    case 'uploading': case 'presigned': return 'border-[#D4AF37]';
    case 'failed': return 'border-red-500';
    default: return 'border-white/20';
  }
};

export const AttachmentPreviewChips = ({ attachments, onRemove }: AttachmentPreviewChipsProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-[#1a1a1a]/50 border-t border-[#D4AF37]/10">
      {attachments.map((att) => (
        <div
          key={att.localId}
          className={`flex items-center gap-2 pl-3 pr-2 py-2 bg-[#0a0a0a] border ${getStatusColor(att.status)} rounded-lg min-w-0 max-w-[200px]`}
        >
          {att.kind === 'image' && att.previewUrl ? (
            <img
              src={att.previewUrl}
              alt={att.file.name}
              className="w-8 h-8 object-cover rounded flex-shrink-0"
            />
          ) : (
            <div className="text-[#D4AF37] flex-shrink-0">
              {getIcon(att.kind)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{att.file.name}</p>
            <p className="text-[10px] text-white/50">{formatFileSize(att.bytes)}</p>
          </div>

          {att.status === 'uploading' || att.status === 'presigned' ? (
            <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          ) : (
            <button
              onClick={() => onRemove(att.localId)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Eltávolítás"
            >
              <X className="w-3 h-3 text-white/70" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
