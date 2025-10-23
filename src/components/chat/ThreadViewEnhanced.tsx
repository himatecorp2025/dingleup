import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { useTypingStatus } from '@/hooks/useTypingStatus';
import { useUserPresence } from '@/hooks/useUserPresence';
import { ImageUploader } from './ImageUploader';
import { FileUploader } from './FileUploader';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { useAttachments } from '@/hooks/useAttachments';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_deleted: boolean;
  media?: Array<{
    media_url: string;
    media_type: string;
    thumbnail_url?: string;
    file_name?: string;
    file_size?: number;
    width?: number;
    height?: number;
    duration_ms?: number;
    mime_type?: string;
  }>;
}

interface ThreadViewEnhancedProps {
  friendId: string;
  userId: string;
  onBack: () => void;
}

export const ThreadViewEnhanced = ({ friendId, userId, onBack }: ThreadViewEnhancedProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [friendInfo, setFriendInfo] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { handleTyping } = useTypingStatus(friendId, userId);
  const { isOnline } = useUserPresence(friendId);
  
  const {
    attachments,
    addAttachment,
    removeAttachment,
    uploadAllAttachments,
    clearAttachments,
    hasUploading,
    allUploaded,
    hasFailed
  } = useAttachments();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadFriendInfo();
    loadMessages();

    const channel = supabase
      .channel(`thread-${friendId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'dm_messages' 
      }, (payload) => {
        if (payload.new.sender_id === friendId || payload.new.sender_id === userId) {
          loadMessages();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [friendId, userId]);

  const loadFriendInfo = async () => {
    const { data } = await supabase
      .from('public_profiles')
      .select('username, avatar_url')
      .eq('id', friendId)
      .single();
    if (data) setFriendInfo(data);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-thread-messages?otherUserId=${friendId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      console.log('[ThreadView] Loaded messages:', data);
      setMessages(data?.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Hiba az üzenetek betöltésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    // Validation: need text or attachments
    if (!messageText.trim() && attachments.length === 0) return;

    // If uploading, wait or auto-send after upload
    if (hasUploading) {
      toast.info('Feltöltés folyamatban...');
      return;
    }

    setSending(true);
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const textToSend = messageText.trim();

    try {
      // Store preview URLs for optimistic UI before upload
      const attachmentPreviews = attachments.map(att => ({
        kind: att.kind,
        previewUrl: att.previewUrl,
        name: att.file.name,
        size: att.bytes,
        w: att.w,
        h: att.h,
        duration: att.duration
      }));

      // Upload all attachments if any
      let uploadedAttachments: any[] = [];
      if (attachments.length > 0) {
        // Get thread ID first
        const normalizedIds = [userId, friendId].sort();
        const { data: thread } = await supabase
          .from('dm_threads')
          .select('id')
          .eq('user_id_a', normalizedIds[0])
          .eq('user_id_b', normalizedIds[1])
          .single();

        if (thread) {
          uploadedAttachments = await uploadAllAttachments(thread.id);
        }
      }

      // Optimistic UI: use blob URLs for immediate preview
      const optimisticMessage: Message = {
        id: clientMessageId,
        thread_id: '',
        sender_id: userId,
        body: textToSend,
        created_at: new Date().toISOString(),
        is_deleted: false,
        media: attachmentPreviews.map(att => ({
          media_url: att.previewUrl, // Temporary blob URL for immediate preview
          media_type: att.kind,
          thumbnail_url: att.kind === 'image' ? att.previewUrl : undefined,
          file_name: att.name,
          file_size: att.size,
          width: att.w,
          height: att.h,
          duration_ms: att.duration,
          mime_type: 'image/jpeg' // Temporary
        }))
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // Send to server
      const { error } = await supabase.functions.invoke('send-dm', {
        body: { 
          recipientId: friendId, 
          body: textToSend,
          attachments: uploadedAttachments,
          clientMessageId
        },
        headers: {
          'Idempotency-Key': clientMessageId
        }
      });

      if (error) throw error;

      // Clear state on success
      setMessageText('');
      clearAttachments();
      
      // Reload to get server message with media
      setTimeout(() => loadMessages(), 1000);
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error('Hiba az üzenet küldésekor');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== clientMessageId));
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájlok engedélyezettek');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kép maximum 10 MB lehet');
      return;
    }
    
    const preview = URL.createObjectURL(file);
    addAttachment(file, 'image', preview);
    setShowAttachmentMenu(false);
    
    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Determine file kind
    let kind: 'video' | 'audio' | 'document' | 'file' = 'file';
    if (file.type.startsWith('video/')) kind = 'video';
    else if (file.type.startsWith('audio/')) kind = 'audio';
    else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('sheet') || file.type.includes('presentation') || file.type.includes('text')) kind = 'document';
    
    // Size limits
    const maxSize = kind === 'video' ? 200 : kind === 'audio' ? 50 : 50;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Fájl maximum ${maxSize} MB lehet`);
      return;
    }
    
    const preview = URL.createObjectURL(file);
    addAttachment(file, kind, preview);
    setShowAttachmentMenu(false);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText = messageText.substring(0, start) + emoji + messageText.substring(end);
      setMessageText(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + emoji.length;
        }
      }, 0);
    } else {
      setMessageText(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const retryFailedUploads = async () => {
    const failed = attachments.filter(a => a.status === 'failed');
    // Simply retry by removing and re-adding (would need thread id)
    toast.info('Újrapróbálkozás...');
  };

  const getStatusColor = () => {
    return isOnline ? 'bg-green-500' : 'bg-gray-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-x-hidden bg-[#000000]">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#1a1a1a] border-b border-[#D4AF37]/10 px-4 py-3 flex items-center gap-3 w-full">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-all"
          aria-label="Vissza"
        >
          <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#8B0000]/20 flex items-center justify-center border border-[#D4AF37]/30">
              {friendInfo?.avatar_url ? (
                <img src={friendInfo.avatar_url} alt={friendInfo.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-[#D4AF37] font-bold">
                  {friendInfo?.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${getStatusColor()}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white truncate">{friendInfo?.username || 'Betöltés...'}</h2>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-2 w-full max-w-full" style={{ maxWidth: '100vw' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-white/50 py-8">Nincs még üzenet</p>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender_id === userId;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id;
            
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                isGrouped={isGrouped}
                partnerAvatar={friendInfo?.avatar_url}
                partnerName={friendInfo?.username || ''}
                showTime={formatTime(msg.created_at)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Composer */}
      <div 
        className="chat-composer flex-shrink-0 bg-[#0F1116] border-t border-[#D4AF37]/30 p-3 flex items-end gap-2 w-full"
        style={{ 
          position: 'fixed', 
          bottom: '72px', 
          left: 0, 
          right: 0, 
          width: '100%',
          maxWidth: '100vw',
          zIndex: 10010,
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))'
        }}
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-[#1a1a1a] border-t border-[#D4AF37]/20 p-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {attachments.map((att) => (
              <div key={att.localId} className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#0F1116] border border-[#D4AF37]/20">
                  {att.kind === 'image' ? (
                    <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#D4AF37] text-xs">
                      📄
                    </div>
                  )}
                </div>
                {att.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                {att.status === 'failed' && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <button onClick={retryFailedUploads} className="text-white">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.localId)}
                  className="absolute -top-1 -right-1 p-1 bg-[#8B0000] rounded-full hover:bg-[#8B0000]/80"
                  aria-label="Törlés"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Attach Button */}
        <button
          onClick={() => setShowAttachmentMenu(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-all flex-shrink-0"
          aria-label="Csatolmány"
        >
          <span className="text-[#D4AF37] text-2xl">+</span>
        </button>

        {/* Text Input */}
        {attachments.length === 0 && (
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Üzenet..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 resize-none outline-none py-2 px-3 min-h-[40px] max-h-[120px] overflow-y-auto scrollbar-hide"
            rows={1}
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          />
        )}

        {/* Send / Emoji Button */}
        {messageText.trim() || attachments.length > 0 ? (
          <button
            onClick={handleSendMessage}
            disabled={sending || (hasUploading && attachments.length > 0)}
            className="p-2 bg-[#138F5E] hover:bg-[#138F5E]/90 rounded-full transition-all flex-shrink-0 disabled:opacity-50"
            aria-label="Küldés"
          >
            {sending || hasUploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-all flex-shrink-0"
            aria-label="Emoji"
          >
            <span className="text-[#D4AF37] text-xl">😊</span>
          </button>
        )}
      </div>

      {/* Modals */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      {showAttachmentMenu && (
        <AttachmentMenu
          onImageSelect={() => imageInputRef.current?.click()}
          onFileSelect={() => fileInputRef.current?.click()}
          onClose={() => setShowAttachmentMenu(false)}
        />
      )}
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/flac,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,text/plain,text/csv,application/zip,application/x-rar-compressed"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
