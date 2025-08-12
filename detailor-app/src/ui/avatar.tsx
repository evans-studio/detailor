import * as React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const avatarStyles = cva(
  [
    'inline-flex items-center justify-center rounded-full',
    'bg-[var(--color-muted)] border border-[var(--color-border)]',
    'font-[var(--font-weight-medium)] select-none',
    'overflow-hidden',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[var(--font-size-xs)]',
        sm: 'h-8 w-8 text-[var(--font-size-xs)]',
        md: 'h-10 w-10 text-[var(--font-size-sm)]',
        lg: 'h-12 w-12 text-[var(--font-size-base)]',
        xl: 'h-16 w-16 text-[var(--font-size-lg)]',
      },
      variant: {
        default: 'bg-[var(--color-muted)] text-[var(--color-text)]',
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        success: 'bg-[var(--color-success)] text-[var(--color-success-foreground)]',
        warning: 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]',
        error: 'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface AvatarProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarStyles> {
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, name, size, variant, ...props }, ref) => {
    // Generate fallback from name if not provided
    const displayFallback = fallback || (name ? getInitials(name) : '?');
    
    return (
      <RadixAvatar.Root 
        ref={ref}
        className={twMerge(avatarStyles({ size, variant }), className)}
        {...props}
      >
        {src && (
          <RadixAvatar.Image 
            src={src} 
            alt={alt || name || 'Avatar'} 
            className="h-full w-full object-cover"
          />
        )}
        <RadixAvatar.Fallback className="text-current">
          {displayFallback}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>
    );
  }
);
Avatar.displayName = 'Avatar';

export const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Fallback 
    ref={ref}
    className={twMerge('text-current', className)}
    {...props} 
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Image 
    ref={ref}
    className={twMerge('h-full w-full object-cover', className)}
    {...props} 
  />
));
AvatarImage.displayName = 'AvatarImage';

// Utility function to generate initials from a name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


