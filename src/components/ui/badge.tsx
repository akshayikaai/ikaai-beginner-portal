import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-brand-50 text-brand-500 dark:bg-brand-50/20 dark:text-brand-500',
        success:
          'bg-success-fill text-success-on dark:bg-success-fill/90',
        warning:
          'bg-warning text-warning-on dark:bg-warning/90',
        outline:
          'border border-line text-ink bg-transparent',
        // Department Specific Badges (verified WCAG AA contrast)
        hr:
          'bg-[#F5F3FF] text-[#5B21B6] dark:bg-[#2E1065] dark:text-[#DDD6FE]',
        analyst:
          'bg-[#E6FCF5] text-[#0C5A69] dark:bg-[#083344] dark:text-[#A5F3FC]',
        research:
          'bg-[#E1EFE4] text-[#003D16] dark:bg-[#052E16] dark:text-[#86EFAC]',
        field:
          'bg-[#FEF3C7] text-[#78350F] dark:bg-[#451A03] dark:text-[#FDE68A]',
        design:
          'bg-[#FDF2F8] text-[#831843] dark:bg-[#500724] dark:text-[#FBCFE8]',
        social:
          'bg-[#FFF7ED] text-[#7C2D12] dark:bg-[#431407] dark:text-[#FED7AA]',
        bizdev:
          'bg-[#F0F9FF] text-[#0369A1] dark:bg-[#082F49] dark:text-[#BAE6FD]',
        content:
          'bg-[#EEF2FF] text-[#312E81] dark:bg-[#1E1B4B] dark:text-[#C7D2FE]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dotColor?: string;
}

function Badge({ className, variant, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dotColor && (
        <span
          className="h-2 w-2 rounded-full inline-block flex-none"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
