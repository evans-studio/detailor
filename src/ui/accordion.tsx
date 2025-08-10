import * as React from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';

export const Accordion = RadixAccordion.Root;
export const AccordionItem = RadixAccordion.Item;
export function AccordionTrigger({ children, ...props }: React.ComponentProps<typeof RadixAccordion.Trigger>) {
  return (
    <RadixAccordion.Header>
      <RadixAccordion.Trigger
        className="w-full text-left px-3 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)]"
        {...props}
      >
        {children}
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}
export function AccordionContent({ children, ...props }: React.ComponentProps<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content className="px-3 py-2 text-[var(--color-text)]" {...props}>
      {children}
    </RadixAccordion.Content>
  );
}


