import type { ChatWithAvatar } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from './icons';
import { memo } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { CompositeUnicorn } from './composite-unicorn';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: ChatWithAvatar;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const renderAvatar = () => {
    if (!chat.avatar) {
      // Default chat icon when no avatar
      return (
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-white">💬</span>
        </div>
      );
    }

    if (chat.avatar.type === 'rom-unicorn' && chat.avatar.unicornParts) {
      return (
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-1 shadow-lg flex items-center justify-center">
          <CompositeUnicorn 
            parts={chat.avatar.unicornParts as {
              body: string;
              hair: string;
              eyes: string;
              mouth: string;
              accessory: string;
            }}
            size={40}
          />
        </div>
      );
    }

    if (chat.avatar.uploadedImage) {
      return (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={chat.avatar.uploadedImage}
            alt={chat.avatar.name || 'Agent avatar'}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
      );
    }

    // Fallback for avatars without proper image data
    return (
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-lg font-bold text-white">
          {chat.avatar.name?.[0]?.toUpperCase() || 'A'}
        </span>
      </div>
    );
  };

  const timeAgo = formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true });

  return (
    <div className={`relative group ${isActive ? 'ring-2 ring-green-500' : ''}`}>
      <Link 
        href={`/chat/${chat.id}`} 
        onClick={() => setOpenMobile(false)}
        className={`block p-4 rounded-xl border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
          isActive 
            ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/10' 
            : 'bg-sidebar-accent/5 border-sidebar-border hover:bg-sidebar-accent/10 hover:border-sidebar-border/50'
        }`}
      >
        <div className="flex items-start gap-3">
          {renderAvatar()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-sm leading-tight truncate text-sidebar-foreground">
                {chat.title}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                chat.visibility === 'public' 
                  ? 'bg-green-500/10 text-green-400' 
                  : 'bg-gray-500/10 text-gray-400'
              }`}>
                {chat.visibility === 'public' ? 'Public' : 'Private'}
              </span>
            </div>
            
            {chat.avatar && (
              <div className="mb-2">
                <p className="text-xs font-medium text-blue-400 truncate">
                  🤖 {chat.avatar.name}
                </p>
                {chat.avatar.personality && (
                  <p className="text-xs text-sidebar-foreground/60 truncate mt-1">
                    {chat.avatar.personality}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-sidebar-foreground/50">
              <span>{timeAgo}</span>
              <div className="flex items-center gap-1">
                {chat.visibility === 'public' ? (
                  <GlobeIcon size={12} />
                ) : (
                  <LockIcon size={12} />
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Dropdown menu positioned absolutely in top-right */}
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-2 right-2 p-1 rounded-lg bg-sidebar-accent/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-sidebar-accent">
            <MoreHorizontalIcon size={16} />
            <span className="sr-only">More options</span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.avatar !== nextProps.chat.avatar) return false;
  if (prevProps.chat.title !== nextProps.chat.title) return false;
  if (prevProps.chat.createdAt !== nextProps.chat.createdAt) return false;
  return true;
});
