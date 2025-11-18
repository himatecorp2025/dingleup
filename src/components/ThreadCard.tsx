import { MoreVertical, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface ThreadCardProps {
  threadId: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessageSnippet: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  onlineStatus: 'online' | 'away' | 'offline';
  onClick: () => void;
  onDelete: (threadId: string) => void;
}

export const ThreadCard = ({
  threadId,
  displayName,
  avatarUrl,
  lastMessageSnippet,
  lastMessageAt,
  unreadCount,
  onlineStatus,
  onClick,
  onDelete,
}: ThreadCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}n`;
    if (hours > 0) return `${hours}ó`;
    if (minutes > 0) return `${minutes}p`;
    return 'most';
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(threadId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <article
        onClick={onClick}
        className="thread-card border border-accent/25 rounded-[10px] p-3 grid grid-cols-[auto_1fr_auto] gap-3 bg-success/5 hover:outline hover:outline-2 hover:outline-accent/35 cursor-pointer transition-all"
      >
        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12 border-2 border-accent">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-accent text-accent-foreground font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          {onlineStatus === 'online' && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-background rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0">
          <div className="thread-title font-bold text-accent truncate">
            {displayName}
          </div>
          {lastMessageSnippet && (
            <div className="thread-snippet text-muted-foreground text-[0.95rem] truncate mt-1">
              {lastMessageSnippet}
            </div>
          )}
        </div>

        {/* Meta + Actions */}
        <div className="flex flex-col items-end gap-2 justify-between">
          <div className="flex items-center gap-2">
            {lastMessageAt && (
              <span className="thread-time text-xs text-muted-foreground">
                {formatTime(lastMessageAt)}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-accent transition-colors p-1"
                aria-label="További műveletek"
              >
                <MoreVertical className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-background border-border/40"
              >
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Beszélgetés törlése
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {unreadCount > 0 && (
            <Badge className="badge-unread bg-success text-foreground font-bold border-none rounded-full px-2 py-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </article>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-accent">
              Beszélgetés törlése
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Biztosan törölni szeretnéd ezt a beszélgetést? Ez csak neked fogja elrejteni, az üzenetek megmaradnak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted text-foreground border-border/30 hover:bg-muted/80">
              Mégse
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-foreground hover:bg-destructive/90 border border-destructive/70"
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
