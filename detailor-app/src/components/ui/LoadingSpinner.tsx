"use client";

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const spinnerStyles = cva(
  [
    'inline-block border-solid border-current border-r-transparent',
    'rounded-full animate-spin',
  ],
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border-[1px]',
        sm: 'h-4 w-4 border-[1.5px]',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-[3px]',
      },
      variant: {
        default: 'text-[var(--color-text-muted)]',
        primary: 'text-[var(--color-primary)]',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps extends VariantProps<typeof spinnerStyles> {
  className?: string;
}

export function LoadingSpinner({ size, variant, className }: LoadingSpinnerProps) {
  return (
    <div
      className={twMerge(spinnerStyles({ size, variant }), className)}
      role="status"
      aria-label="Loading..."
    />
  );
}

// Pulsing dots animation
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={twMerge('flex items-center space-x-1', className)}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Progress bar with smooth animation
export function ProgressBar({ 
  value, 
  max = 100,
  className,
  showValue = false 
}: { 
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={twMerge('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        {showValue && (
          <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div className="progress-bar h-2 w-full">
        <div 
          className="progress-fill h-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Skeleton loader with shimmer effect
export function Skeleton({ 
  className,
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={twMerge('skeleton rounded-[var(--radius-md)]', className)}>
      {children}
    </div>
  );
}

// Loading overlay for containers
export function LoadingOverlay({ 
  isLoading,
  children,
  className,
  message = 'Loading...'
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <div className={twMerge('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
          <div className="flex flex-col items-center gap-3 p-6 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] animate-scale-in">
            <LoadingSpinner size="lg" variant="primary" />
            <span className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] font-medium">
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Success checkmark animation
export function SuccessCheckmark({ 
  className,
  size = 'md' 
}: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={twMerge('inline-flex items-center justify-center', className)}>
      <svg
        className={twMerge(sizeClasses[size], 'text-[var(--color-success)]')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
          className="success-checkmark"
        />
      </svg>
    </div>
  );
}