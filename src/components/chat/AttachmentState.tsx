export type AttachmentStatus = 'queued' | 'presigned' | 'uploading' | 'uploaded' | 'failed';

export interface Attachment {
  localId: string;
  kind: 'image' | 'video' | 'audio' | 'document' | 'file';
  file: File;
  previewUrl: string;
  status: AttachmentStatus;
  progress?: number;
  w?: number;
  h?: number;
  bytes?: number;
  duration?: number; // videó/audió hossza ms-ban
  remote?: {
    key?: string;
    url?: string;
    mime?: string;
    thumbnailUrl?: string;
  };
  error?: string;
}

export interface AttachmentMeta {
  kind: 'image' | 'video' | 'audio' | 'document' | 'file';
  key: string;
  url: string;
  mime: string;
  name?: string;
  w?: number;
  h?: number;
  bytes: number;
  duration?: number;
  thumbnailUrl?: string;
}
