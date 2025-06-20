'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 bg-black border-r border-green-500/20">
      <SidebarHeader className="border-b border-green-500/20 bg-black/50 backdrop-blur-sm">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              {/* <span className="text-lg font-semibold font-mono px-2 hover:bg-green-500/10 text-green-200 rounded-md cursor-pointer transition-all duration-200 hover:text-green-100">
                Rom Cards
              </span> */}
              <img src="/images/logo.png" className="size-10" />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit text-green-300 hover:bg-green-500/10 hover:text-green-200"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="bg-black border-green-500/30 text-green-200 font-mono">NEW CHAT</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-black">
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className="border-t border-green-500/20 bg-black/50 backdrop-blur-sm">{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
