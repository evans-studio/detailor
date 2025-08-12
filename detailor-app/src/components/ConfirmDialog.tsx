"use client";
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';

export function ConfirmDialog({
  open,
  title = 'Confirm',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        {description ? <div className="mt-2 text-[var(--color-text-muted)]">{description}</div> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button intent="ghost" onClick={() => onOpenChange(false)}>{cancelText}</Button>
          <Button intent="destructive" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


