import { useState, useRef } from 'react';
import { FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploaderProps {
  threadId: string;
  onFileSelected: (file: File, preview: string) => void;
  onUploadComplete: (url: string, path: string, fileName: string, fileSize: number, mimeType: string) => void;
  onCancel: () => void;
  selectedFile?: { file: File; preview: string } | null;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'text/plain',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const FileUploader = ({ 
  threadId, 
  onFileSelected, 
  onUploadComplete, 
  onCancel,
  selectedFile 
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Nem támogatott fájltípus. Engedélyezett: PDF, ZIP, DOCX, XLSX, PPTX, TXT');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('A fájl mérete maximum 25 MB lehet');
      return;
    }

    // Create preview (file icon + name)
    const preview = file.name;
    onFileSelected(file, preview);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Get signed upload URL (reuse the same endpoint, just different contentType)
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-chat-image',
        {
          body: {
            filename: selectedFile.file.name,
            contentType: selectedFile.file.type,
            threadId
          }
        }
      );

      if (uploadError) throw uploadError;

      // Upload file to storage using signed URL
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: selectedFile.file,
        headers: {
          'Content-Type': selectedFile.file.type,
          'x-upsert': 'true'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(uploadData.path);

      onUploadComplete(
        publicUrl,
        uploadData.path,
        selectedFile.file.name,
        selectedFile.file.size,
        selectedFile.file.type
      );

      toast.success('Fájl sikeresen feltöltve');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Hiba a fájl feltöltésekor');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="w-5 h-5" />;
    
    const type = selectedFile.file.type;
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('sheet')) return '📊';
    if (type.includes('presentation')) return '📽️';
    if (type.includes('zip')) return '🗜️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center gap-2">
      {!selectedFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0"
          aria-label="Fájl feltöltése"
        >
          <FileText className="w-5 h-5 text-[#D4AF37]" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-2 border border-[#D4AF37]/20">
          <div className="flex items-center gap-2 px-2">
            <span className="text-2xl">{getFileIcon()}</span>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate max-w-[120px]">
                {selectedFile.file.name}
              </p>
              <p className="text-xs text-white/50">
                {formatFileSize(selectedFile.file.size)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1.5 bg-gradient-to-br from-blue-700 via-purple-700 to-purple-900 hover:from-blue-600 hover:via-purple-600 hover:to-purple-800 rounded-lg text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-purple-500/30"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Küldés...</span>
                </>
              ) : (
                <span>Küldés</span>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={uploading}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50"
              aria-label="Mégse"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.zip,.docx,.xlsx,.pptx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
