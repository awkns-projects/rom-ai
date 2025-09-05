'use client';
import { forwardRef } from 'react';
import Link from 'next/link';
import { memo } from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

interface AppWrapperProps {
  children: React.ReactNode;
}

const PureAppWrapper = forwardRef<HTMLElement, AppWrapperProps>(({ children }, ref) => {
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <>
      {/* Simplified Header - visible on both mobile and desktop */}
      <header 
        ref={ref}
        className="flex sticky top-0 bg-black border-b border-green-500/20 py-2 items-center px-4 backdrop-blur-xl z-50"
      >
        {/* Logo on the left */}
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="Rom Cards" width={32} height={32} />
        </Link>

        {/* Spacer to push buttons to the right */}
        <div className="flex-1" />

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
          >
            <Bell size={20} />
          </Button>

          {/* Profile Button */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-full p-0 hover:bg-green-500/10"
                >
                  <Image
                    src={`https://avatar.vercel.sh/${session.user.email}`}
                    alt={session.user.email ?? 'User Avatar'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-green-500/30">
                <DropdownMenuItem className="text-green-200 hover:bg-green-500/10">
                  <span className="text-sm">{session.user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-green-500/20" />
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                  Toggle theme
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => signOut()}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main content with bottom padding for tabs */}
      <main className="pb-20">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-black to-slate-900 border-t border-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-xl z-50 shadow-lg shadow-purple-500/10">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center justify-around w-full">
            <Link 
              href="/marketplace"
              className="flex flex-col items-center justify-center py-2 px-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">💎</span>
              <span className="text-xs font-mono font-semibold">Home</span>
            </Link>

            <Link 
              href="/play"
              className="flex flex-col items-center justify-center py-2 px-2 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🤖</span>
              <span className="text-xs font-mono font-semibold">Agents</span>
            </Link>

            <Link 
              href="/chat"
              className="flex flex-col items-center justify-center py-2 px-2 text-orange-300 hover:text-orange-200 hover:bg-orange-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">💬</span>
              <span className="text-xs font-mono font-semibold">Chat</span>
            </Link>

            <Link 
              href="/mission"
              className="flex flex-col items-center justify-center py-2 px-2 text-violet-300 hover:text-violet-200 hover:bg-violet-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🎯</span>
              <span className="text-xs font-mono font-semibold">Tournaments</span>
            </Link>

            <Link 
              href="/cards"
              className="flex flex-col items-center justify-center py-2 px-2 text-pink-300 hover:text-pink-200 hover:bg-pink-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🃏</span>
              <span className="text-xs font-mono font-semibold">Items</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Dock Navigation */}
      <nav className="hidden md:block fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gradient-to-r from-slate-900 via-black to-slate-900 backdrop-blur-xl border border-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl p-3 shadow-lg shadow-purple-500/10">
          <div className="flex items-center gap-2">
            <Link 
              href="/"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] text-emerald-200 hover:text-emerald-100 hover:bg-emerald-300/40 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-300 relative z-10">💎</span>
              <span className="text-xs font-mono font-bold relative z-10">Home</span>
            </Link>

            <Link 
              href="/build"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] text-cyan-200 hover:text-cyan-100 hover:bg-cyan-300/40 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-300 relative z-10">🤖</span>
              <span className="text-xs font-mono font-bold relative z-10">Agents</span>
            </Link>

            <Link 
              href="/chat"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] text-orange-200 hover:text-orange-100 hover:bg-orange-300/40 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-orange-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-300 relative z-10">💬</span>
              <span className="text-xs font-mono font-bold relative z-10">Chat</span>
            </Link>

            <Link 
              href="/tournaments"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] text-violet-200 hover:text-violet-100 hover:bg-violet-300/40 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-violet-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-300 relative z-10">🎯</span>
              <span className="text-xs font-mono font-bold relative z-10">Tournaments</span>
            </Link>

            <Link 
              href="/launcher"
              className="flex flex-col items-center justify-center w-[80px] h-[80px] text-pink-200 hover:text-pink-100 hover:bg-pink-300/40 rounded-xl transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-pink-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <span className="text-2xl mb-1 group-hover:scale-125 transition-transform duration-300 relative z-10">🃏</span>
              <span className="text-xs font-mono font-bold relative z-10">Items</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
});

PureAppWrapper.displayName = 'PureAppWrapper';

export const AppWrapper = memo(PureAppWrapper); 