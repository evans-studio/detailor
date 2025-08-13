"use client";

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/ui/button';

const modalOverlayVariants = cva([
  'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
  'modal-overlay data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
]);

const modalContentVariants = cva(
  [
    'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
    'modal-content data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'bg-[var(--color-surface)] border border-[var(--color-border)]',
    'shadow-[var(--shadow-xl)] rounded-[var(--radius-xl)]',
    'animate-gpu focus-ring',
  ],
  {
    variants: {
      size: {
        sm: 'w-full max-w-md',
        md: 'w-full max-w-lg',
        lg: 'w-full max-w-xl',
        xl: 'w-full max-w-3xl',
        full: 'w-[95vw] max-w-none h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const drawerContentVariants = cva([
  'fixed z-50 gap-4 bg-[var(--color-surface)] border border-[var(--color-border)]',
  'shadow-[var(--shadow-xl)] transition ease-in-out animate-gpu',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=closed]:duration-300 data-[state=open]:duration-500',
], {
  variants: {
    side: {
      top: [
        'inset-x-0 top-0 border-b drawer-down',
        'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
      ],
      bottom: [
        'inset-x-0 bottom-0 border-t drawer-up',
        'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
      ],
      left: [
        'inset-y-0 left-0 h-full w-3/4 border-r drawer-left',
        'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        'sm:max-w-sm',
      ],
      right: [
        'inset-y-0 right-0 h-full w-3/4 border-l drawer-right',
        'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        'sm:max-w-sm',
      ],
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

export interface ModalProps extends VariantProps<typeof modalContentVariants> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function Modal({
  children,
  title,
  description,
  open,
  onOpenChange,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  size = 'md',
  className,
  overlayClassName,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={twMerge(modalOverlayVariants(), overlayClassName)}
          onClick={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        />
        <Dialog.Content
          className={twMerge(modalContentVariants({ size }), className)}
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                {title && (
                  <Dialog.Title className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-2">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {showCloseButton && (
                <Dialog.Close asChild>
                  <Button
                    intent="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-[var(--color-muted)]"
                    aria-label="Close modal"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </Dialog.Close>
              )}
            </div>
          )}
          <div className={title || showCloseButton ? 'p-6 pt-4' : 'p-6'}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface DrawerProps extends VariantProps<typeof drawerContentVariants> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function Drawer({
  children,
  title,
  description,
  open,
  onOpenChange,
  showCloseButton = true,
  side = 'right',
  className,
  overlayClassName,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={twMerge(modalOverlayVariants(), overlayClassName)} />
        <Dialog.Content className={twMerge(drawerContentVariants({ side }), className)}>
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                {title && (
                  <Dialog.Title className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-2">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {showCloseButton && (
                <Dialog.Close asChild>
                  <Button
                    intent="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-[var(--color-muted)]"
                    aria-label="Close drawer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </Dialog.Close>
              )}
            </div>
          )}
          <div className={title || showCloseButton ? 'p-6 pt-4 flex-1 overflow-auto' : 'p-6 flex-1 overflow-auto'}>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Modal Footer for consistent action placement
export function ModalFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={twMerge(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30',
      className
    )}>
      {children}
    </div>
  );
}

// Confirmation Modal with built-in actions
export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  description = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  loading = false,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'primary';
  loading?: boolean;
  className?: string;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      className={className}
    >
      <ModalFooter>
        <Button
          intent="ghost"
          onClick={handleCancel}
          disabled={isLoading || loading}
        >
          {cancelText}
        </Button>
        <Button
          intent={variant}
          onClick={handleConfirm}
          loading={isLoading || loading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Quick access components
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;