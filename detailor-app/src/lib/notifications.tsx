"use client";
import * as React from 'react';
import { Toaster, Toast } from '@/ui/toast';

type Notification = { id: string; title: string; description?: string };

const NotificationsContext = React.createContext<{ notify: (n: Omit<Notification, 'id'>) => void } | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<Notification | null>(null);

  const notify = React.useCallback((n: Omit<Notification, 'id'>) => {
    setQueue((q) => [...q, { ...n, id: crypto.randomUUID() }]);
  }, []);

  React.useEffect(() => {
    if (!open && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
      setOpen(true);
    }
  }, [open, queue]);

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <Toaster>
        {current && (
          <Toast title={current.title} description={current.description} open={open} onOpenChange={setOpen} />
        )}
      </Toaster>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}


