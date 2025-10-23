export type AttachmentStatus = 'queued' | 'presigned' | 'uploading' | 'uploaded' | 'failed';

export interface Attachment {
  localId: string;
  kind: 'image' | 'file';
  file: File;
  previewUrl: string;
  status: AttachmentStatus;
  progress?: number;
  w?: number;
  h?: number;
  bytes?: number;
  remote?: {
    key?: string;
    url?: string;
    mime?: string;
  };
  error?: string;
}

export interface AttachmentMeta {
  kind: 'image' | 'file';
  key: string;
  url: string;
  mime: string;
  name?: string;
  w?: number;
  h?: number;
  bytes: number;
}
