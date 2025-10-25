import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ArrowLeft, Brain, Loader2, X, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageBubble } from './MessageBubble';
import { useTypingStatus } from '@/hooks/useTypingStatus';
import { useUserPresence } from '@/hooks/useUserPresence';
import { useIOSViewport } from '@/hooks/useIOSViewport';
import { recordScrollToBottom } from '@/hooks/useScrollInspector';
import { ImageUploader } from './ImageUploader';
import { FileUploader } from './FileUploader';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { useAttachments } from '@/hooks/useAttachments';
import { AttachmentPreviewChips } from './AttachmentPreviewChips';

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_deleted: boolean;
  delivery_status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
  client_temp_id?: string;
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
  hideHeader?: boolean;
}

export const ThreadViewEnhanced = ({ friendId, userId, onBack, hideHeader = false }: ThreadViewEnhancedProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [friendInfo, setFriendInfo] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [composerHeight, setComposerHeight] = useState(68);
  const [isSendAnimating, setIsSendAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  
  const { handleTyping } = useTypingStatus(friendId, userId);
  const { isOnline } = useUserPresence(friendId);
  
  // iOS viewport fix for keyboard handling
  useIOSViewport();
  
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

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth', source = 'unknown') => {
    recordScrollToBottom(source);
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 120; // within 120px of bottom
  };

  const handleScroll = async () => {
    if (!messagesContainerRef.current || loadingMore || !hasMore) return;
    
    const { scrollTop } = messagesContainerRef.current;
    const wasNearBottom = isNearBottomRef.current;
    isNearBottomRef.current = checkIfNearBottom();
    
    // Show/hide new messages badge
    if (wasNearBottom && !isNearBottomRef.current) {
      setShowNewBadge(false);
    } else if (!isNearBottomRef.current && showNewBadge) {
      // Keep badge visible
    } else if (isNearBottomRef.current) {
      setShowNewBadge(false);
    }
    
    // Load more when scrolled to top 10%
    if (scrollTop < 100 && hasMore && messages.length > 0) {
      await loadMoreMessages();
    }
  };

  // ResizeObserver for composer height
  useLayoutEffect(() => {
    if (!composerRef.current) return;
    
    const ro = new ResizeObserver(() => {
      const h = composerRef.current?.offsetHeight ?? 68;
      setComposerHeight(h);
      document.documentElement.style.setProperty('--composer-h', `${h}px`);
    });
    
    ro.observe(composerRef.current);
    return () => ro.disconnect();
  }, []);

  // REMOVED: Auto-scroll on every messages.length change (caused jumps)
  // Now handled explicitly in message send/receive events only

  useEffect(() => {
    loadFriendInfo();
    loadMessages();

    // Subscribe to messages in this thread - both sender and receiver will get updates
    const channel = supabase
      .channel(`dm-thread-${friendId}-${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'dm_messages',
        filter: `thread_id=eq.${null}` // Will be updated after first message
      }, async (payload) => {
        const newMsg = payload.new as any;
        console.log('[ThreadView] New message INSERT event:', newMsg.id, 'from:', newMsg.sender_id);
        
        // Check if this message belongs to current thread (both users)
        if (newMsg.sender_id === friendId || newMsg.sender_id === userId) {
          try {
            // Fetch single complete message with media
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.warn('[ThreadView] No session for fetching new message');
              return;
            }

            console.log('[ThreadView] Fetching complete message:', newMsg.id);
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-thread-messages?otherUserId=${friendId}`,
              {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              // Find the specific new message (not just the last one)
              const fetchedMessage = data?.messages?.find((m: any) => m.id === newMsg.id);
              
              if (fetchedMessage) {
                console.log('[ThreadView] Received complete message with', fetchedMessage.media?.length || 0, 'media items', {
                  mediaArray: fetchedMessage.media
                });
                
                setMessages(prev => {
                  const exists = prev.find(m => m.id === newMsg.id);
                  const next = exists
                    ? prev.map(m => (m.id === newMsg.id ? fetchedMessage : m))
                    : [...prev, fetchedMessage];
                  // Stable sort (epoch + id fallback)
                  return next.sort((a, b) => {
                    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
                  });
                });
                
                // Auto-scroll if user is near bottom, otherwise show "new" badge
                if (isNearBottomRef.current) {
                  requestAnimationFrame(() => scrollToBottom('smooth', 'ws-new-message'));
                } else {
                  setShowNewBadge(true);
                }
              } else {
                console.warn('[ThreadView] Message not found in response, reloading all');
                loadMessages();
              }
            } else {
              console.error('[ThreadView] Failed to fetch message, status:', response.status);
              loadMessages();
            }
          } catch (err) {
            console.error('[ThreadView] Error fetching new message:', err);
            loadMessages();
          }
        } else {
          console.log('[ThreadView] Message from different thread, ignoring');
        }
      })
      .subscribe((status) => {
        console.log('[ThreadView] Realtime subscription status:', status);
      });

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

  const loadMessages = async (initial = true) => {
    if (initial) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-thread-messages?otherUserId=${friendId}&limit=50`,
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
      // Sort messages with stable ordering (epoch + id fallback)
      const sortedMessages = (data?.messages || []).sort((a: Message, b: Message) => {
        const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
      });
      setMessages(sortedMessages);
      setHasMore(data?.messages?.length === 50);
      
      if (initial) {
        // Scroll to bottom immediately on initial load
        requestAnimationFrame(() => {
          scrollToBottom('auto', 'initial-load');
          isNearBottomRef.current = true;
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Hiba az üzenetek betöltésekor');
    } finally {
      if (initial) setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    setLoadingMore(true);
    const oldestMessageTimestamp = messages[0]?.created_at;
    const previousScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-thread-messages?otherUserId=${friendId}&before=${oldestMessageTimestamp}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load more messages');

      const data = await response.json();
      const olderMessages = data?.messages || [];
      
      if (olderMessages.length > 0) {
        // Sort older messages with stable ordering
        const sortedOlder = olderMessages.sort((a: Message, b: Message) => {
          const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
        });
        setMessages(prev => {
          const combined = [...sortedOlder, ...prev];
          // Remove duplicates based on id
          const unique = combined.filter((msg, index, self) =>
            index === self.findIndex(m => m.id === msg.id)
          );
          return unique.sort((a, b) => {
            const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
          });
        });
        setHasMore(olderMessages.length === 50);
        
        // Maintain scroll position
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Hiba a korábbi üzenetek betöltésekor');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async () => {
    // Validation: need text or attachments
    if (!messageText.trim() && attachments.length === 0) return;

    // Don't block if attachments are queued - they will be uploaded during send
    // Only block if actively uploading to prevent duplicate sends
    if (sending) return;

    // Trigger send animation
    setIsSendAnimating(true);
    setTimeout(() => setIsSendAnimating(false), 300);

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

      // Upload all attachments if any - DON'T WAIT FOR COMPLETION
      let uploadPromise: Promise<any[]> | null = null;
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
          // Start upload but don't await - let it run in background
          uploadPromise = uploadAllAttachments(thread.id);
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
        delivery_status: 'sending',
        client_temp_id: clientMessageId,
        media: attachmentPreviews.map(att => ({
          media_url: att.previewUrl,
          media_type: att.kind,
          thumbnail_url: att.kind === 'image' ? att.previewUrl : undefined,
          file_name: att.name,
          file_size: att.size,
          width: att.w,
          height: att.h,
          duration_ms: att.duration,
          mime_type: 'image/jpeg'
        }))
      };
      setMessages(prev => {
        const updated = [...prev, optimisticMessage];
        // Stable sort
        return updated.sort((a, b) => {
          const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
        });
      });
      
      // Auto-scroll ONLY if at bottom
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('smooth', 'send-optimistic'));
      }

      // Wait for uploads to complete before sending (but show optimistic UI immediately)
      const uploadedAttachments = uploadPromise ? await uploadPromise : [];

      console.log('[ThreadView] Uploads completed:', uploadedAttachments.length, 'attachments');

      // Send to server with uploaded attachments
      const { data: response, error } = await supabase.functions.invoke('send-dm', {
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

      console.log('[ThreadView] Server response:', response, 'error:', error);

      // If we got a valid message response, treat as success even if error is present
      if (response?.message) {
        console.log('[ThreadView] Server returned message with', response.message.media?.length || 0, 'media items');
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.id === clientMessageId || m.client_temp_id === clientMessageId) {
              return {
                ...response.message,
                delivery_status: 'sent',
                client_temp_id: clientMessageId,
                media: response.message.media || []
              };
            }
            return m;
          });
          // Stable sort
          const sorted = updated.sort((a, b) => {
            const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
          });
          console.log('[ThreadView] Updated messages, total:', sorted.length);
          return sorted;
        });
        
        // Auto-scroll ONLY if at bottom
        if (isNearBottomRef.current) {
          requestAnimationFrame(() => scrollToBottom('smooth', 'send-confirmed'));
        }
      } else if (error) {
        // Only throw error if we didn't get a valid message
        throw error;
      }
    } catch (error: any) {
      console.error('Send error:', error);
      
      // Only show error toast if message was not successfully sent
      const messageSent = messages.find(m => 
        (m.id === clientMessageId || m.client_temp_id === clientMessageId) && 
        m.delivery_status === 'sent'
      );
      
      if (!messageSent) {
        toast.error('Hiba az üzenet küldésekor');
        // Mark message as failed instead of removing
        setMessages(prev => prev.map(m => 
          m.id === clientMessageId ? { ...m, delivery_status: 'failed' } : m
        ));
      }
    } finally {
      setSending(false);
      // Always reset composer even if sending fails
      setMessageText('');
      clearAttachments();
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    const failedMessage = messages.find(m => m.id === messageId);
    if (!failedMessage) return;

    // Update status to sending
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, delivery_status: 'sending' } : m
    ));

    try {
      const { data: response, error } = await supabase.functions.invoke('send-dm', {
        body: { 
          recipientId: friendId, 
          body: failedMessage.body,
          attachments: [],
          clientMessageId: messageId
        },
        headers: {
          'Idempotency-Key': messageId
        }
      });

      if (error) throw error;

      if (response?.message) {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...response.message, delivery_status: 'sent' } : m
        ));
        toast.success('Üzenet újraküldve');
      }
    } catch (error: any) {
      console.error('Retry error:', error);
      toast.error('Újraküldés sikertelen');
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, delivery_status: 'failed' } : m
      ));
    }
  };

  const handleImageSelect = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachClick = () => {
    // Directly open file picker for all file types
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('[FileUpload] Selected file:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // Determine file kind based on MIME type
    let kind: 'image' | 'video' | 'audio' | 'document' | 'file' = 'file';
    if (file.type.startsWith('image/')) {
      kind = 'image';
    } else if (file.type.startsWith('video/')) {
      kind = 'video';
    } else if (file.type.startsWith('audio/')) {
      kind = 'audio';
    } else if (
      file.type.includes('pdf') || 
      file.type.includes('document') || 
      file.type.includes('sheet') || 
      file.type.includes('presentation') || 
      file.type.includes('text') ||
      file.type.includes('msword') ||
      file.type.includes('officedocument')
    ) {
      kind = 'document';
    }
    
    console.log('[FileUpload] Detected kind:', kind);
    
    // Size limits based on file type
    let maxSize = 50; // Default 50 MB
    if (kind === 'video') maxSize = 200;
    if (kind === 'audio') maxSize = 50;
    if (kind === 'image') maxSize = 10;
    if (kind === 'document') maxSize = 50;
    
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Fájl maximum ${maxSize} MB lehet`);
      return;
    }
    
    const preview = URL.createObjectURL(file);
    addAttachment(file, kind, preview);
    
    console.log('[FileUpload] Attachment added successfully');
    
    // Reset input
    e.target.value = '';
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
    <div className="chat-thread" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f0f12', overflow: 'hidden' }}>
      {/* Header - Fixed at top (optional) */}
      { !hideHeader && (
        <header 
          role="banner"
          className="appbar"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--appbar-h)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 12px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 30
          }}
        >
          <button
            onClick={onBack}
            className="back p-2 hover:bg-white/10 rounded-full transition-all"
            aria-label="Vissza a beszélgetésekhez"
            style={{ background: 'transparent', border: 0 }}
          >
            <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
          </button>
          <div className="title flex-1 flex items-center gap-3 min-w-0" aria-live="polite">
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
              <h2 className="font-semibold text-white truncate">{friendInfo?.username || 'Betöltés...'}</h2>
              {isOnline && <p className="text-xs text-[#138F5E]">Online</p>}
            </div>
          </div>
          <div className="actions" />
        </header>
      )}

      {/* Messages - Scrollable Area */}
      <main 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="list"
        aria-label="Üzenetek"
        className="messages"
        data-scroll-root="thread"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          padding: '12px',
          paddingTop: 'var(--appbar-h)',
          paddingBottom: `calc(var(--composer-h) + var(--bottom-nav-h) + 12px)`,
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          position: 'relative'
        }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-white/50 py-8">Nincs még üzenet</p>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
              </div>
            )}
            {!hasMore && messages.length > 20 && (
              <p className="text-center text-white/30 text-xs py-2">
                Beszélgetés kezdete
              </p>
            )}
            {messages.map((msg, idx) => {
              const isOwn = msg.sender_id === userId;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isGrouped = prevMsg && prevMsg.sender_id === msg.sender_id;
              
              return (
                <div key={msg.id} role="listitem">
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    isGrouped={isGrouped}
                    partnerAvatar={friendInfo?.avatar_url}
                    partnerName={friendInfo?.username || ''}
                    showTime={formatTime(msg.created_at)}
                    onRetry={msg.delivery_status === 'failed' ? () => handleRetryMessage(msg.id) : undefined}
                  />
                </div>
              );
            })}
            {showNewBadge && (
              <button 
                className="new-badge"
                onClick={() => {
                  scrollToBottom('smooth', 'new-badge-click');
                  setShowNewBadge(false);
                }}
                style={{
                  position: 'sticky',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'block',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 10
                }}
              >
                Új üzenetek ↓
              </button>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Composer - Fixed at bottom */}
      <div 
        ref={composerRef}
        role="form"
        aria-label="Üzenet írása"
        className="composer"
        style={{
          position: 'fixed',
          bottom: `var(--bottom-nav-h)`,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          borderTop: '1px solid rgba(212, 175, 55, 0.1)',
          zIndex: 10050
        }}
      >
        {/* Attachment Preview Chips */}
        <AttachmentPreviewChips 
          attachments={attachments} 
          onRemove={removeAttachment}
        />

        {/* Composer Input Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center', padding: '10px 12px' }}>

        {/* Attach Button */}
        <button
          onClick={handleAttachClick}
          className="attach p-2 hover:bg-white/10 rounded-full transition-all"
          aria-label="Csatolás"
          style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
        >
          <span className="text-[#D4AF37] text-2xl font-bold">＋</span>
        </button>

        {/* Text Input */}
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
          placeholder="Írj üzenetet..."
          className="input"
          rows={1}
          style={{ 
            width: '100%',
            padding: '12px 14px',
            borderRadius: '22px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            outline: 'none',
            resize: 'none',
            minHeight: '40px',
            maxHeight: '120px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        />

        {/* Send Button with Brain Icon - Right side */}
        <button
          onClick={handleSendMessage}
          disabled={sending || (!messageText.trim() && attachments.length === 0)}
          className="send p-2 bg-gradient-to-br from-blue-700 via-purple-700 to-purple-900 hover:from-blue-600 hover:via-purple-600 hover:to-purple-800 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
          aria-label="Küldés"
          style={{ 
            border: 0, 
            cursor: sending ? 'wait' : 'pointer', 
            fontWeight: 600,
            transform: isSendAnimating ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {sending ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Brain className="w-6 h-6 text-white" />
          )}
        </button>
      </div>
      </div>

      {/* Modals */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
        onChange={processFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/flac,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed"
        onChange={processFileUpload}
        className="hidden"
      />
    </div>
  );
};
