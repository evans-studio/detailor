import * as React from 'react';
import * as RadixRadioGroup from '@radix-ui/react-radio-group';

export interface RadioGroupProps extends RadixRadioGroup.RadioGroupProps {
  options: Array<{ label: string; value: string }>; 
}

export function RadioGroup({ options, ...props }: RadioGroupProps) {
  return (
    <RadixRadioGroup.Root className="grid gap-2" {...props}>
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-2 cursor-pointer">
          <RadixRadioGroup.Item
            className="h-4 w-4 rounded-full border border-[var(--color-border)] data-[state=checked]:border-[var(--color-primary)] focus-visible:shadow-[var(--shadow-focus)]"
            value={opt.value}
          >
            <RadixRadioGroup.Indicator className="block h-full w-full rounded-full bg-[var(--color-primary)]" />
          </RadixRadioGroup.Item>
          <span className="text-[var(--color-text)] text-[var(--font-size-sm)]">{opt.label}</span>
        </label>
      ))}
    </RadixRadioGroup.Root>
  );
}


