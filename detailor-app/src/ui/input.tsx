import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const inputVariants = cva([
  'w-full px-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]',
  'text-[var(--color-text)] placeholder-[var(--color-text-muted)]',
  'border border-[var(--color-border)] transition-smooth',
  'focus-ring input-enhanced animate-gpu',
  'focus:border-[var(--color-primary)] focus:form-field-focus',
  'hover:border-[var(--color-primary)]/50',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'read-only:bg-[var(--color-muted)]/30',
], {
  variants: {
    size: {
      sm: 'h-8 text-[var(--font-size-sm)] px-2',
      md: 'h-10 text-[var(--font-size-base)]',
      lg: 'h-12 text-[var(--font-size-lg)] px-4',
    },
    variant: {
      default: '',
      error: 'border-[var(--color-error)] focus:border-[var(--color-error)] form-validation-error',
      success: 'border-[var(--color-success)] focus:border-[var(--color-success)]',
      warning: 'border-[var(--color-warning)] focus:border-[var(--color-warning)]',
    },
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-[var(--radius-sm)]',
      md: 'rounded-[var(--radius-md)]',
      lg: 'rounded-[var(--radius-lg)]',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
    rounded: 'md',
  },
});

export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, 
  VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  loading?: boolean;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    containerClassName,
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    rightElement,
    loading,
    size,
    variant,
    rounded,
    disabled,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(props.value || props.defaultValue));
    const inputRef = React.useRef<HTMLInputElement>(null);
    const errorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    // Handle validation shake animation
    React.useEffect(() => {
      if (error && inputRef.current) {
        inputRef.current.classList.add('form-validation-shake');
        errorTimeoutRef.current = setTimeout(() => {
          inputRef.current?.classList.remove('form-validation-shake');
        }, 500);
      }
      return () => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      };
    }, [error]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      props.onChange?.(e);
    };

    const actualVariant = error ? 'error' : variant;
    const isDisabled = disabled || loading;

    const inputElement = (
      <div className={twMerge(
        'relative flex items-center',
        isDisabled && 'opacity-60 cursor-not-allowed',
        containerClassName
      )}>
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 z-10 text-[var(--color-text-muted)] pointer-events-none">
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          className={twMerge(
            inputVariants({ size, variant: actualVariant, rounded }),
            leftIcon && 'pl-10',
            (rightIcon || rightElement) && 'pr-10',
            className
          )}
          disabled={isDisabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {/* Right Icon/Element */}
        {(rightIcon || rightElement) && (
          <div className="absolute right-3 z-10 flex items-center text-[var(--color-text-muted)]">
            {rightElement || rightIcon}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && !leftIcon && !rightIcon && !rightElement && (
          <div className="absolute right-3 z-10">
            <svg className="w-4 h-4 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Focus Enhancement Effect */}
        {isFocused && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 rounded-[inherit] form-field-glow" />
          </div>
        )}
      </div>
    );

    // If no label, return just the input
    if (!label && !error && !hint) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label 
            className={twMerge(
              'block text-[var(--font-size-sm)] font-[var(--font-weight-medium)] transition-smooth',
              isFocused || hasValue ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]',
              isDisabled && 'opacity-60'
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {label}
          </label>
        )}

        {/* Input */}
        {inputElement}

        {/* Error/Hint */}
        {(error || hint) && (
          <div className="space-y-1">
            {error && (
              <p className="text-[var(--font-size-xs)] text-[var(--color-error)] flex items-center gap-1 animate-slide-in-up">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                {hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';


