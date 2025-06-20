import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-green-500/20 bg-black/50 px-3 py-2 text-base text-green-200 font-mono ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-green-200 placeholder:text-green-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:border-green-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm shadow-lg shadow-green-500/10',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
