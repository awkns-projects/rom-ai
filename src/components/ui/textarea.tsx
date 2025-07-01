import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-green-500/20 bg-black/50 px-3 py-2 text-base text-green-200 font-mono ring-offset-black placeholder:text-green-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:border-green-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm shadow-lg shadow-green-500/10 resize-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
