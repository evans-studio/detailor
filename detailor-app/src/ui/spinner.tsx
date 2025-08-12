import * as React from 'react';

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-[var(--color-primary)]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
      <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth="4"></path>
    </svg>
  );
}


