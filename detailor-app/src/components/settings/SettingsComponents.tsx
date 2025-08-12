"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';

// Settings Section Component
interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  premium?: boolean;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function SettingsSection({
  title,
  description,
  icon,
  badge,
  premium,
  children,
  className,
  collapsible = false,
  defaultExpanded = true
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader 
        className={`${collapsible ? 'cursor-pointer' : ''}`}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-[var(--font-size-lg)]">{title}</CardTitle>
                {badge && <Badge variant="primary" size="sm">{badge}</Badge>}
                {premium && <Badge variant="warning" size="sm">Pro</Badge>}
              </div>
              {description && (
                <CardDescription className="mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {collapsible && (
            <Button intent="ghost" size="sm">
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>
      {(!collapsible || isExpanded) && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Settings Field Component
interface SettingsFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  premium?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  description,
  error,
  required,
  premium,
  children,
  className
}: SettingsFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </label>
        {premium && <Badge variant="warning" size="sm">Pro</Badge>}
      </div>
      {description && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-error)] flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// Settings Form Actions
interface SettingsActionsProps {
  onSave: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  saveText?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SettingsActions({
  onSave,
  onReset,
  onCancel,
  isSaving = false,
  hasChanges = false,
  saveText = 'Save Changes',
  className,
  children
}: SettingsActionsProps) {
  return (
    <div className={`flex items-center justify-between p-6 bg-[var(--color-muted)]/30 border-t border-[var(--color-border)] ${className}`}>
      <div className="flex items-center gap-2">
        {hasChanges && (
          <div className="flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-warning)]"></div>
            <span>You have unsaved changes</span>
          </div>
        )}
        {children}
      </div>
      
      <div className="flex items-center gap-2">
        {onReset && (
          <Button 
            intent="ghost" 
            onClick={onReset}
            disabled={isSaving || !hasChanges}
          >
            Reset
          </Button>
        )}
        {onCancel && (
          <Button 
            intent="ghost" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
        <Button 
          intent="primary" 
          onClick={onSave}
          disabled={isSaving || !hasChanges}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : (
            saveText
          )}
        </Button>
      </div>
    </div>
  );
}

// Settings Grid Layout
interface SettingsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function SettingsGrid({ 
  children, 
  columns = 1,
  className 
}: SettingsGridProps) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Time Input Component
interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function TimeInput({
  value,
  onChange,
  placeholder = "HH:MM",
  disabled,
  error
}: TimeInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={error ? 'border-[var(--color-error)]' : ''}
    />
  );
}

// Color Input Component
interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  previewSize?: 'sm' | 'md' | 'lg';
}

export function ColorInput({
  value,
  onChange,
  placeholder = "#000000",
  disabled,
  previewSize = 'md'
}: ColorInputProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[previewSize]} rounded-[var(--radius-sm)] border border-[var(--color-border)] flex-shrink-0`}
        style={{ backgroundColor: value || placeholder }}
      />
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-24 font-mono text-[var(--font-size-sm)]"
      />
    </div>
  );
}

// Settings Toggle Component
interface SettingsToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  premium?: boolean;
}

export function SettingsToggle({
  enabled,
  onChange,
  label,
  description,
  disabled,
  premium
}: SettingsToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
            {label}
          </span>
          {premium && <Badge variant="warning" size="sm">Pro</Badge>}
        </div>
        {description && (
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          ${enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

// Multi-Select Component for Settings
interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  disabled
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full rounded-[var(--radius-md)] border border-[var(--color-border)] 
          bg-[var(--color-surface)] py-2 pl-3 pr-10 text-left shadow-sm 
          focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-default'}
        `}
      >
        <span className="block truncate text-[var(--color-text)]">
          {selected.length > 0 
            ? `${selected.length} selected`
            : placeholder
          }
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-5 w-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-lg border border-[var(--color-border)]">
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => !option.disabled && toggleOption(option.value)}
                className={`
                  relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-[var(--color-hover-surface)]
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="block truncate text-[var(--color-text)]">
                  {option.label}
                </span>
                {selected.includes(option.value) && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-primary)]">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Preview Component
interface SettingsPreviewProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsPreview({ 
  title, 
  children, 
  className 
}: SettingsPreviewProps) {
  return (
    <div className={`border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-[var(--color-muted)]/30 border-b border-[var(--color-border)]">
        <h4 className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
          {title}
        </h4>
      </div>
      <div className="p-4 bg-[var(--color-surface)]">
        {children}
      </div>
    </div>
  );
}