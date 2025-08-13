"use client";

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { Badge } from '@/ui/badge';

const toastVariants = cva(
  [
    'relative pointer-events-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)]',
    'border shadow-[var(--shadow-lg)] backdrop-blur-sm',
    'notification-slide-in-right animate-gpu',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-surface)]/95 border-[var(--color-border)]',
          'text-[var(--color-text)]',
        ],
        success: [
          'bg-gradient-to-r from-[var(--color-success)]/90 to-[var(--color-success-600)]/90',
          'border-[var(--color-success)] text-white',
        ],
        error: [
          'bg-gradient-to-r from-[var(--color-error)]/90 to-[var(--color-error-600)]/90',
          'border-[var(--color-error)] text-white',
        ],
        warning: [
          'bg-gradient-to-r from-[var(--color-warning)]/90 to-[var(--color-warning-600)]/90',
          'border-[var(--color-warning)] text-white',
        ],
        info: [
          'bg-gradient-to-r from-[var(--color-info)]/90 to-[var(--color-info-600)]/90',
          'border-[var(--color-info)] text-white',
        ],
        primary: [
          'bg-gradient-to-r from-[var(--color-primary)]/90 to-[var(--color-primary-600)]/90',
          'border-[var(--color-primary)] text-white',
        ],
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const iconMap = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  primary: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  default: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.515 14.462L2.05 13.028a.5.5 0 01.028-.949l18.1-7.1a.5.5 0 01.637.637l-7.1 18.1a.5.5 0 01-.949.028l-1.434-2.465L4.515 14.462z" />
    </svg>
  ),
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // in milliseconds
  onClose?: () => void;
  persistent?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function Toast({
  id,
  title,
  description,
  action,
  duration = 5000,
  onClose,
  persistent = false,
  showProgress = true,
  variant = 'default',
  size = 'md',
  className,
}: ToastProps) {
  const [isClosing, setIsClosing] = React.useState(false);
  const [progress, setProgress] = React.useState(100);
  const progressRef = React.useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isColored = variant !== 'default';
  const Icon = iconMap[variant || 'default'];

  React.useEffect(() => {
    if (persistent) return;

    // Start progress bar animation
    if (showProgress) {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        
        if (remaining > 0) {
          progressRef.current = setTimeout(updateProgress, 50);
        }
      };
      updateProgress();
    }

    // Auto close
    closeTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (progressRef.current) clearTimeout(progressRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [duration, persistent, showProgress]);

  const handleClose = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300); // Match animation duration
  };

  const handleMouseEnter = () => {
    if (progressRef.current) clearTimeout(progressRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (persistent) return;
    
    const remainingTime = (progress / 100) * duration;
    closeTimeoutRef.current = setTimeout(handleClose, remainingTime);
    
    if (showProgress && remainingTime > 0) {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, progress - (elapsed / remainingTime) * progress);
        setProgress(remaining);
        
        if (remaining > 0) {
          progressRef.current = setTimeout(updateProgress, 50);
        }
      };
      updateProgress();
    }
  };

  return (
    <div
      className={twMerge(
        toastVariants({ variant, size }),
        isClosing && 'notification-slide-out-right',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-4 -translate-y-4">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-transparent opacity-30" />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-1.5 rounded-[var(--radius-md)] transition-transform
          ${isColored 
            ? 'bg-white/20 text-white' 
            : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
          }
        `}>
          {Icon}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className={`
            text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] leading-tight
            ${isColored ? 'text-white' : 'text-[var(--color-text)]'}
          `}>
            {title}
          </div>
          {description && (
            <div className={`
              text-[var(--font-size-xs)] mt-1 leading-relaxed
              ${isColored ? 'text-white/80' : 'text-[var(--color-text-muted)]'}
            `}>
              {description}
            </div>
          )}
        </div>

        {/* Action & Close */}
        <div className="flex items-center gap-2 ml-2">
          {action && (
            <button
              onClick={action.onClick}
              className={`
                text-[var(--font-size-xs)] font-[var(--font-weight-medium)] px-2 py-1
                rounded-[var(--radius-sm)] transition-all hover:scale-105
                ${isColored 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                }
              `}
            >
              {action.label}
            </button>
          )}
          
          {!persistent && (
            <button
              onClick={handleClose}
              className={`
                p-1 rounded-[var(--radius-sm)] transition-all hover:scale-110
                ${isColored 
                  ? 'text-white/70 hover:text-white hover:bg-white/20' 
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-muted)]'
                }
              `}
              aria-label="Close notification"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && !persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
          <div className={`
            h-full transition-all duration-75 ease-linear
            ${isColored 
              ? 'bg-white/30' 
              : 'bg-[var(--color-border)]'
            }
          `}>
            <div
              className={`
                h-full transition-all duration-75 ease-linear notification-progress-bar
                ${isColored 
                  ? 'bg-white/60' 
                  : 'bg-[var(--color-primary)]'
                }
              `}
              style={{ 
                width: `${progress}%`,
                transformOrigin: 'left'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Toast Container for managing multiple toasts
export function ToastContainer({ 
  toasts, 
  position = 'top-right',
  className 
}: {
  toasts: (ToastProps & { id: string })[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}) {
  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={twMerge(
      'z-50 pointer-events-none toast-stack',
      positionClasses[position],
      className
    )}>
      <div className="flex flex-col gap-2 max-w-sm">
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            {...toast}
            className={twMerge(
              'pointer-events-auto',
              index > 0 && 'opacity-90 scale-98',
              index > 1 && 'opacity-70 scale-95',
              toast.className
            )}
          />
        ))}
      </div>
    </div>
  );
}