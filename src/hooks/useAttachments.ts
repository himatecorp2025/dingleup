import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Attachment, AttachmentMeta, AttachmentStatus } from '@/components/chat/AttachmentState';

export const useAttachments = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addAttachment = useCallback((file: File, kind: 'image' | 'video' | 'audio' | 'document' | 'file', previewUrl: string) => {
    const localId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newAttachment: Attachment = {
      localId,
      kind,
      file,
      previewUrl,
      status: 'queued',
      bytes: file.size
    };
    setAttachments(prev => [...prev, newAttachment]);
    return localId;
  }, []);

  const removeAttachment = useCallback((localId: string) => {
    setAttachments(prev => prev.filter(a => a.localId !== localId));
  }, []);

  const updateAttachmentStatus = useCallback((localId: string, status: AttachmentStatus, updates?: Partial<Attachment>) => {
    setAttachments(prev => prev.map(a => 
      a.localId === localId ? { ...a, status, ...updates } : a
    ));
  }, []);

  const uploadAttachment = useCallback(async (localId: string, threadId: string) => {
    const attachment = attachments.find(a => a.localId === localId);
    if (!attachment) return null;

    try {
      updateAttachmentStatus(localId, 'presigned');

      // Get dimensions for images
      let w: number | undefined;
      let h: number | undefined;
      if (attachment.kind === 'image') {
        const img = new Image();
        img.src = attachment.previewUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        w = img.width;
        h = img.height;
      }

      // Get presigned URL
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'upload-chat-image',
        {
          body: {
            filename: attachment.file.name,
            contentType: attachment.file.type,
            threadId
          }
        }
      );

      if (uploadError) throw uploadError;

      updateAttachmentStatus(localId, 'uploading', { 
        remote: { 
          key: uploadData.path, 
          mime: attachment.file.type 
        } 
      });

      // Upload to storage
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: attachment.file,
        headers: {
          'Content-Type': attachment.file.type,
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

      updateAttachmentStatus(localId, 'uploaded', {
        w,
        h,
        remote: {
          key: uploadData.path,
          url: publicUrl,
          mime: attachment.file.type
        }
      });

      return {
        kind: attachment.kind,
        key: uploadData.path,
        url: publicUrl,
        mime: attachment.file.type,
        name: attachment.file.name,
        w,
        h,
        bytes: attachment.file.size
      } as AttachmentMeta;

    } catch (error) {
      console.error('Upload error:', error);
      updateAttachmentStatus(localId, 'failed', { 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
      return null;
    }
  }, [attachments, updateAttachmentStatus]);

  const uploadAllAttachments = useCallback(async (threadId: string): Promise<AttachmentMeta[]> => {
    const uploadPromises = attachments
      .filter(a => a.status === 'queued' || a.status === 'failed')
      .map(a => uploadAttachment(a.localId, threadId));

    const results = await Promise.all(uploadPromises);
    return results.filter((r): r is AttachmentMeta => r !== null);
  }, [attachments, uploadAttachment]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const hasUploading = attachments.some(a => ['queued', 'presigned', 'uploading'].includes(a.status));
  const allUploaded = attachments.length > 0 && attachments.every(a => a.status === 'uploaded');
  const hasFailed = attachments.some(a => a.status === 'failed');

  return {
    attachments,
    addAttachment,
    removeAttachment,
    uploadAttachment,
    uploadAllAttachments,
    clearAttachments,
    hasUploading,
    allUploaded,
    hasFailed
  };
};
