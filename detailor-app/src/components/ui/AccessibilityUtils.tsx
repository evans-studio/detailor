"use client";

import * as React from 'react';
import { twMerge } from 'tailwind-merge';

// Skip to content link for keyboard navigation
export function SkipLink({ href = "#main-content", className, children }: {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={twMerge(
        'absolute -top-full left-6 z-[9999] px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        'rounded-[var(--radius-md)] font-[var(--font-weight-semibold)] text-[var(--font-size-sm)]',
        'focus:top-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        'focus:ring-offset-[var(--color-primary)]',
        className
      )}
    >
      {children || 'Skip to main content'}
    </a>
  );
}

// Screen reader only content
export function ScreenReaderOnly({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={twMerge('sr-only', className)}>
      {children}
    </span>
  );
}

// Accessible heading with proper hierarchy
export function AccessibleHeading({ 
  level, 
  children, 
  className,
  id,
  ...props 
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  const headingClasses = {
    1: 'text-[var(--font-size-4xl)] font-[var(--font-weight-bold)] leading-tight',
    2: 'text-[var(--font-size-3xl)] font-[var(--font-weight-bold)] leading-tight',
    3: 'text-[var(--font-size-2xl)] font-[var(--font-weight-semibold)] leading-snug',
    4: 'text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] leading-snug',
    5: 'text-[var(--font-size-lg)] font-[var(--font-weight-medium)] leading-normal',
    6: 'text-[var(--font-size-base)] font-[var(--font-weight-medium)] leading-normal',
  };

  return (
    <HeadingTag
      id={id}
      className={twMerge(
        'text-[var(--color-text)]',
        headingClasses[level],
        className
      )}
      {...props}
    >
      {children}
    </HeadingTag>
  );
}

// Focus trap for modals and dialogs
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }

      if (e.key === 'Escape') {
        // Allow escape to close modal (handled by parent)
        previousActiveElement.current?.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus when trap is disabled
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

// Announcement region for screen readers
export function LiveRegion({ 
  children, 
  politeness = 'polite',
  className 
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  className?: string;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={twMerge('sr-only', className)}
    >
      {children}
    </div>
  );
}

// Progress indicator with proper ARIA attributes
export function AccessibleProgress({
  value,
  max = 100,
  label,
  description,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  description?: string;
  className?: string;
}) {
  const percentage = Math.round((value / max) * 100);
  const progressId = React.useId();
  const labelId = React.useId();
  const descId = React.useId();

  return (
    <div className={twMerge('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <label id={labelId} className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
          {label}
        </label>
        <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]" aria-hidden="true">
          {percentage}%
        </span>
      </div>
      
      <div
        role="progressbar"
        id={progressId}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        className="w-full h-2 bg-[var(--color-muted)] rounded-full overflow-hidden"
      >
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      
      {description && (
        <p id={descId} className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      
      <ScreenReaderOnly>
        {label}: {percentage} percent complete
      </ScreenReaderOnly>
    </div>
  );
}

// Accessible button with loading state
export function AccessibleButton({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled = false,
  className,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center gap-2 px-4 py-2',
        'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-[var(--radius-md)]',
        'font-[var(--font-weight-medium)] text-[var(--font-size-sm)]',
        'hover:bg-[var(--color-primary-600)] focus:outline-none',
        'focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      <span>{loading ? loadingText : children}</span>
      
      {loading && (
        <span id="loading-description" className="sr-only">
          Please wait, this action is in progress
        </span>
      )}
    </button>
  );
}

// Accessible form field with proper labeling and error association
export function AccessibleFormField({
  label,
  children,
  error,
  hint,
  required = false,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  const fieldId = React.useId();
  const errorId = React.useId();
  const hintId = React.useId();

  return (
    <div className={twMerge('space-y-2', className)}>
      <label 
        htmlFor={fieldId}
        className="block text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]"
      >
        {label}
        {required && (
          <span className="text-[var(--color-error)] ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div>
        {React.cloneElement(children as React.ReactElement<any>, {
          id: fieldId,
          'aria-describedby': [
            hint ? hintId : '',
            error ? errorId : ''
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        })}
      </div>
      
      {hint && (
        <p id={hintId} className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId} 
          role="alert"
          className="text-[var(--font-size-xs)] text-[var(--color-error)] flex items-center gap-1"
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Keyboard navigation hook
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onActivate?: (item: T, index: number) => void;
  } = {}
) {
  const { orientation = 'both', loop = true, onActivate } = options;
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (items.length === 0) return;

    let newIndex = activeIndex;
    const lastIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'horizontal') return;
        e.preventDefault();
        newIndex = activeIndex < lastIndex ? activeIndex + 1 : loop ? 0 : activeIndex;
        break;
        
      case 'ArrowUp':
        if (orientation === 'horizontal') return;
        e.preventDefault();
        newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? lastIndex : activeIndex;
        break;
        
      case 'ArrowRight':
        if (orientation === 'vertical') return;
        e.preventDefault();
        newIndex = activeIndex < lastIndex ? activeIndex + 1 : loop ? 0 : activeIndex;
        break;
        
      case 'ArrowLeft':
        if (orientation === 'vertical') return;
        e.preventDefault();
        newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? lastIndex : activeIndex;
        break;
        
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
        
      case 'End':
        e.preventDefault();
        newIndex = lastIndex;
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        onActivate?.(items[activeIndex], activeIndex);
        return;
        
      default:
        return;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      items[newIndex]?.focus();
    }
  }, [items, activeIndex, orientation, loop, onActivate]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { activeIndex, setActiveIndex };
}