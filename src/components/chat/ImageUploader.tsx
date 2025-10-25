import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploaderProps {
  threadId: string;
  onImageSelected: (file: File, preview: string) => void;
  onUploadComplete: (url: string, path: string, width: number, height: number, size: number) => void;
  onCancel: () => void;
  selectedImage?: { file: File; preview: string } | null;
}

export const ImageUploader = ({ 
  threadId, 
  onImageSelected, 
  onUploadComplete, 
  onCancel,
  selectedImage 
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Csak JPEG, PNG vagy WEBP formátum engedélyezett');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A kép mérete maximum 10 MB lehet');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelected(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    try {
      // Get image dimensions
      const img = new Image();
      img.src = selectedImage.preview;
      await new Promise((resolve) => { img.onload = resolve; });

      // Get signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-chat-image',
        {
          body: {
            filename: selectedImage.file.name,
            contentType: selectedImage.file.type,
            threadId
          }
        }
      );

      if (uploadError) throw uploadError;

      // Upload file to storage using signed URL
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: selectedImage.file,
        headers: {
          'Content-Type': selectedImage.file.type,
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
        img.width,
        img.height,
        selectedImage.file.size
      );

      toast.success('Kép sikeresen feltöltve');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Hiba a kép feltöltésekor');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!selectedImage ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 flex-shrink-0"
          aria-label="Kép feltöltése"
        >
          <ImagePlus className="w-5 h-5 text-[#D4AF37]" />
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-2 border border-[#D4AF37]/20">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
            <img 
              src={selectedImage.preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1.5 bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-lg text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-purple-500/30"
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
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};