import * as React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

export const Tabs = RadixTabs.Root;
export const TabsList = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <RadixTabs.List className={`inline-flex gap-2 border-b border-[var(--color-border)] ${className}`} {...props} />
);
export const TabsTrigger = ({ className = '', ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) => (
  <RadixTabs.Trigger
    className={`px-3 py-2 text-[var(--color-text)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] ${className}`}
    {...props}
  />
);
export const TabsContent = ({ className = '', ...props }: React.ComponentProps<typeof RadixTabs.Content>) => (
  <RadixTabs.Content className={`pt-3 ${className}`} {...props} />
);


