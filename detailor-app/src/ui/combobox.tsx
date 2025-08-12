import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/ui/popover';
import { Input } from '@/ui/input';

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Type to filter…',
}: {
  options: Array<{ label: string; value: string }>;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = options.find((o) => o.value === value)?.label || '';
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-56 items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-left text-[var(--color-text)] focus-visible:shadow-[var(--shadow-focus)]"
        >
          {selected || 'Select…'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-2">
          <Input placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="max-h-48 overflow-auto">
            {filtered.map((o) => (
              <button
                key={o.value}
                className="w-full cursor-pointer rounded-[var(--radius-xs)] px-2 py-1 text-left hover:bg-[var(--color-hover-surface)]"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQuery('');
                }}
              >
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-1 text-[var(--color-text-muted)] text-[var(--font-size-sm)]">No results</div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


