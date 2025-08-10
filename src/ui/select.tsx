import * as React from 'react';
import * as RadixSelect from '@radix-ui/react-select';

export interface SelectProps extends RadixSelect.SelectProps {
  options: Array<{ label: string; value: string }>; 
  placeholder?: string;
}

export function Select({ options, placeholder = 'Select…', ...props }: SelectProps) {
  return (
    <RadixSelect.Root {...props}>
      <RadixSelect.Trigger className="inline-flex h-10 w-56 items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--color-text)] focus-visible:shadow-[var(--shadow-focus)]">
        <RadixSelect.Value placeholder={placeholder} />
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="cursor-pointer rounded-[var(--radius-xs)] px-2 py-1 text-[var(--color-text)] hover:bg-[var(--color-hover-surface)]"
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}


