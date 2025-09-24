'use client';

import { forwardRef, useState, useEffect, memo, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

import { GoogleAuthContext } from '@/components/providers/google-auth-provider';
import { XAuthContext } from '@/components/providers/x-auth-provider';
import { FacebookAuthContext } from '@/components/providers/facebook-auth-provider';
// import { InstagramAuthContext } from '@/components/providers/instagram-auth-provider';
import { ThreadsAuthContext } from '@/components/providers/threads-auth-provider';
import { ShopifyAuthContext } from '@/components/providers/shopify-auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppWrapperProps {
  children: React.ReactNode;
}

const PureAppWrapper = forwardRef<HTMLElement, AppWrapperProps>(({ children }, ref) => {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  const googleAuth = useContext(GoogleAuthContext);
  const xAuth = useContext(XAuthContext);
  const facebookAuth = useContext(FacebookAuthContext);
  // const instagramAuth = useContext(InstagramAuthContext);
  const threadsAuth = useContext(ThreadsAuthContext);
  const shopifyAuth = useContext(ShopifyAuthContext);

  const handleGoogleAuth = () =>{
    if(googleAuth.userInfo.email) {
      googleAuth.userLogout();
    } else{
      googleAuth.userLogin();
    }
  }
  const handleXAuth = () => {
    if(xAuth.userInfo.id) {
      xAuth.userLogout();
    } else{
      xAuth.userLogin();
    }
  }
  const handleFacebookAuth = () => {
    if(facebookAuth.userInfo.id) {
      facebookAuth.userLogout();
    } else{
      facebookAuth.userLogin();
    }
  }
  // const handleInstagramAuth = () => {
  //   instagramAuth.userLogin();
  // }
  const handleThreadsAuth = () => {
    threadsAuth.userLogin();
  }
  const handleShopifyAuth = () => {
    if(shopifyAuth.userInfo.shop) {
      shopifyAuth.userLogout();
    } else{
      shopifyAuth.userLogin();
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/* Header with desktop navigation */}
      <header 
        ref={ref}
        className="flex sticky top-0 bg-black border-b border-green-500/20 py-2 items-center px-4 backdrop-blur-xl z-50"
      >
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="Rom Cards" width={32} height={32} />
          </Link>

          {/* Desktop Navigation Links - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-emerald-200 hover:text-emerald-100 hover:bg-emerald-300/20 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">💎</span>
              <span className="text-sm font-mono font-semibold">Home</span>
            </Link>

            <Link 
              href="/agents/my-agents/chat"
              className="flex items-center gap-2 px-3 py-2 text-cyan-200 hover:text-cyan-100 hover:bg-cyan-300/20 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">🤖</span>
              <span className="text-sm font-mono font-semibold">Build</span>
            </Link>

            <Link 
              href="/agents/explore"
              className="flex items-center gap-2 px-3 py-2 text-purple-200 hover:text-purple-100 hover:bg-purple-300/20 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">🤖</span>
              <span className="text-sm font-mono font-semibold">Agents</span>
            </Link>

           
            <Link 
              href="/tournaments"
              className="flex items-center gap-2 px-3 py-2 text-violet-200 hover:text-violet-100 hover:bg-violet-300/20 rounded-lg transition-all duration-200 group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">🎯</span>
              <span className="text-sm font-mono font-semibold">Tournaments</span>
            </Link>

           
          </nav>
        </div>

        {/* Spacer to push buttons to the right */}
        <div className="flex-1" />

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          {/* <Button
            variant="ghost"
            size="icon"
            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
          >
            <Bell size={20} />
          </Button> */}

          {/* Profile Button */}
          {isMounted && session?.user && (
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
                {/* <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                >
                  Toggle theme
                </DropdownMenuItem> */}

                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleGoogleAuth()}}
                >
                  {
                    googleAuth.userInfo.email?
                    `🔑 Google Logout(${googleAuth.userInfo.email})`: "🔒 Google Login"
                  }
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleXAuth()}}
                >
                  {
                    xAuth.userInfo.id?
                    `🔑 X Logout(${xAuth.userInfo.name})`: "🔒 X Login"
                  }
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleFacebookAuth()}}
                >
                  {
                    facebookAuth.userInfo.id?
                    `🔑 Facebook Logout(${facebookAuth.userInfo.name})`: "🔒 Facebook Login"
                  }
                </DropdownMenuItem>
                {/* <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleInstagramAuth()}}
                >
                  Instagram Login
                </DropdownMenuItem> */}
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleThreadsAuth()}}
                >
                  Threads Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-green-200 hover:bg-green-500/10 cursor-pointer"
                  onClick={() => {handleShopifyAuth()}}
                >
                  {
                    shopifyAuth.userInfo.shop?
                    `🔑 Shopify Logout(${shopifyAuth.userInfo.shop.domain})`: "🔒 Shopify Login"
                  }
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-green-500/20" />

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

      {/* Main content with bottom padding only for mobile */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation - unchanged */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 via-black to-slate-900 backdrop-blur-xl z-50 shadow-lg shadow-purple-500/10">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center justify-around w-full">
            <Link 
              href="/"
              className="flex flex-col items-center justify-center py-2 px-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">💎</span>
              <span className="text-xs font-mono font-semibold">Home</span>
            </Link>

            <Link 
              href="/agents/my-agents/chat"
              className="flex flex-col items-center justify-center py-2 px-2 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🤖</span>
              <span className="text-xs font-mono font-semibold">Build</span>
            </Link>

            <Link 
              href="/agents/explore"
              className="flex flex-col items-center justify-center py-2 px-2 text-purple-300 hover:text-purple-200 hover:bg-purple-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🤖</span>
              <span className="text-xs font-mono font-semibold">Agents</span>
            </Link>

            <Link 
              href="/tournaments"
              className="flex flex-col items-center justify-center py-2 px-2 text-violet-300 hover:text-violet-200 hover:bg-violet-400/30 rounded-lg transition-all duration-200 min-w-0 flex-1 group"
            >
              <span className="text-lg mb-1 group-hover:scale-110 transition-transform duration-200">🎯</span>
              <span className="text-xs font-mono font-semibold">Tournaments</span>
            </Link>

          </div>
        </div>
      </nav>
    </>
  );
});

PureAppWrapper.displayName = 'PureAppWrapper';

export const AppWrapper = memo(PureAppWrapper); 