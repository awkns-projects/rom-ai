import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium font-mono ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-green-600 to-green-700 text-black hover:from-green-700 hover:to-green-800 border border-green-500/30 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:shadow-xl transform hover:-translate-y-0.5',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 border border-red-500/30 shadow-lg shadow-red-500/20',
        outline:
          'border border-green-500/30 bg-black/50 text-green-300 hover:bg-green-500/10 hover:text-green-200 hover:border-green-500/50 backdrop-blur-sm',
        secondary:
          'bg-zinc-900/50 text-green-200 hover:bg-zinc-800/50 border border-green-500/20 backdrop-blur-sm',
        ghost: 'text-green-300 hover:bg-green-500/10 hover:text-green-200',
        link: 'text-green-400 underline-offset-4 hover:underline hover:text-green-300',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
