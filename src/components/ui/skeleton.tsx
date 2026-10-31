import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-element bg-brand-50/70 dark:bg-brand-50/10',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
