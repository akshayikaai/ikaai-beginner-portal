import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none min-h-[44px]',
  {
    variants: {
      variant: {
        default:
          'bg-brand-500 text-brand-on hover:bg-brand-600 shadow-sm active:scale-[0.99]',
        outline:
          'border border-line bg-transparent text-ink hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-50/10 active:scale-[0.99]',
        secondary:
          'bg-brand-50 text-brand-500 hover:bg-brand-100 dark:bg-brand-50/20 active:scale-[0.99]',
        ghost:
          'hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-50/10 text-ink',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3.5 text-xs min-h-[36px]',
        lg: 'h-12 px-8 text-base min-h-[48px]',
        icon: 'h-11 w-11 p-0 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
