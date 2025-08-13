"use client";

import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'slide' | 'fade' | 'scale' | 'slideUp';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
}

export function PageTransition({
  children,
  className,
  variant = 'slide',
  duration = 'normal',
  delay = 0,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const variantClasses = {
    slide: 'page-transition-enter animate-slide-in-right',
    fade: 'animate-fade-in',
    scale: 'animate-scale-in',
    slideUp: 'animate-slide-in-up',
  };

  const durationClasses = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
  };

  return (
    <div
      className={twMerge(
        'animate-gpu',
        isVisible && variantClasses[variant],
        durationClasses[duration],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Breadcrumb component with animations
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  maxItems?: number;
}

export function Breadcrumb({
  items,
  separator,
  className,
  maxItems = 3,
}: BreadcrumbProps) {
  const [visibleItems, setVisibleItems] = React.useState<BreadcrumbItem[]>([]);

  React.useEffect(() => {
    // Stagger the appearance of breadcrumb items
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, items[index]]);
      }, index * 100);
    });
  }, [items]);

  const defaultSeparator = (
    <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  const shouldCollapse = items.length > maxItems;
  const displayItems = shouldCollapse 
    ? [items[0], { label: '...', href: undefined }, ...items.slice(-2)]
    : items;

  return (
    <nav className={twMerge('flex items-center space-x-2 text-[var(--font-size-sm)]', className)}>
      {displayItems.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <div className="breadcrumb-item flex items-center gap-2">
            {item.icon && (
              <span className="text-[var(--color-text-muted)]">
                {item.icon}
              </span>
            )}
            
            {item.href || item.onClick ? (
              <button
                onClick={item.onClick || (() => window.location.href = item.href!)}
                className={twMerge(
                  'hover:text-[var(--color-primary)] transition-colors',
                  index === displayItems.length - 1
                    ? 'text-[var(--color-text)] font-[var(--font-weight-medium)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                )}
              >
                {item.label}
              </button>
            ) : (
              <span className={twMerge(
                index === displayItems.length - 1
                  ? 'text-[var(--color-text)] font-[var(--font-weight-medium)]'
                  : 'text-[var(--color-text-muted)]'
              )}>
                {item.label}
              </span>
            )}
          </div>
          
          {index < displayItems.length - 1 && (
            <span className="flex-shrink-0">
              {separator || defaultSeparator}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Tab component with animated indicator
export interface TabItem {
  key: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'line' | 'card' | 'pill';
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  size = 'md',
  variant = 'line',
  className,
  tabClassName,
  contentClassName,
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(activeKey || items[0]?.key);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});
  const tabsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeKey !== undefined) {
      setActiveTab(activeKey);
    }
  }, [activeKey]);

  React.useEffect(() => {
    updateIndicator();
  }, [activeTab]);

  const updateIndicator = () => {
    if (!tabsRef.current || variant !== 'line') return;

    const activeElement = tabsRef.current.querySelector(`[data-tab-key="${activeTab}"]`) as HTMLElement;
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth,
        '--from-x': `${indicatorStyle.left || offsetLeft}px`,
        '--to-x': `${offsetLeft}px`,
        '--from-width': `${indicatorStyle.width || offsetWidth}px`,
        '--to-width': `${offsetWidth}px`,
      } as React.CSSProperties);
    }
  };

  const handleTabChange = (key: string) => {
    if (items.find(item => item.key === key)?.disabled) return;
    
    setActiveTab(key);
    onChange?.(key);
  };

  const sizeClasses = {
    sm: 'text-[var(--font-size-sm)] px-3 py-2',
    md: 'text-[var(--font-size-base)] px-4 py-2.5',
    lg: 'text-[var(--font-size-lg)] px-6 py-3',
  };

  const variantClasses = {
    line: 'border-b border-[var(--color-border)]',
    card: 'bg-[var(--color-muted)]/30 rounded-[var(--radius-lg)] p-1',
    pill: 'bg-[var(--color-muted)]/30 rounded-full p-1',
  };

  const activeItem = items.find(item => item.key === activeTab);

  return (
    <div className={twMerge('w-full', className)}>
      {/* Tab Navigation */}
      <div 
        ref={tabsRef}
        className={twMerge(
          'relative flex',
          variantClasses[variant],
          className
        )}
      >
        {items.map((item) => {
          const isActive = item.key === activeTab;
          
          return (
            <button
              key={item.key}
              data-tab-key={item.key}
              onClick={() => handleTabChange(item.key)}
              disabled={item.disabled}
              className={twMerge(
                'relative flex items-center gap-2 transition-smooth font-[var(--font-weight-medium)]',
                'hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 rounded-[var(--radius-sm)]',
                sizeClasses[size],
                isActive 
                  ? 'text-[var(--color-primary)] nav-item-active'
                  : 'text-[var(--color-text-muted)]',
                variant !== 'line' && isActive && 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]',
                variant !== 'line' && 'rounded-[var(--radius-md)]',
                tabClassName
              )}
            >
              {item.icon && (
                <span className={twMerge(
                  'transition-transform',
                  isActive && 'scale-110'
                )}>
                  {item.icon}
                </span>
              )}
              
              <span>{item.label}</span>
              
              {item.badge && (
                <span className={twMerge(
                  'ml-1 px-1.5 py-0.5 text-[var(--font-size-xs)] rounded-full',
                  'bg-[var(--color-primary)] text-white',
                  'animate-scale-in'
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Animated Indicator */}
        {variant === 'line' && (
          <div
            className="absolute bottom-0 h-0.5 bg-[var(--color-primary)] transition-all duration-300 tab-indicator"
            style={indicatorStyle}
          />
        )}
      </div>

      {/* Tab Content */}
      {activeItem?.content && (
        <div className={twMerge(
          'mt-6 animate-fade-in',
          contentClassName
        )}>
          {activeItem.content}
        </div>
      )}
    </div>
  );
}

// Page loading component with animations
export interface PageLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'progress';
  className?: string;
}

export function PageLoading({
  text = "Loading...",
  size = 'md',
  variant = 'spinner',
  className,
}: PageLoadingProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (variant === 'progress') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [variant]);

  const sizeClasses = {
    sm: 'text-[var(--font-size-sm)]',
    md: 'text-[var(--font-size-base)]',
    lg: 'text-[var(--font-size-lg)]',
  };

  return (
    <div className={twMerge(
      'flex flex-col items-center justify-center min-h-[200px] animate-fade-in',
      sizeClasses[size],
      className
    )}>
      {/* Loading Indicator */}
      <div className="mb-4">
        {variant === 'spinner' && (
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
        )}
        
        {variant === 'dots' && (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
        
        {variant === 'progress' && (
          <div className="w-48 h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] transition-all duration-300 notification-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Loading Text */}
      <p className="text-[var(--color-text-muted)] font-[var(--font-weight-medium)]">
        {text}
      </p>
    </div>
  );
}

// Navigation menu with animations
export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
  disabled?: boolean;
}

export interface NavigationProps {
  items: NavigationItem[];
  activeKey?: string;
  collapsed?: boolean;
  onItemClick?: (key: string, item: NavigationItem) => void;
  className?: string;
}

export function Navigation({
  items,
  activeKey,
  collapsed = false,
  onItemClick,
  className,
}: NavigationProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(new Set());

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return;
    
    if (item.children && item.children.length > 0) {
      const newExpandedKeys = new Set(expandedKeys);
      if (expandedKeys.has(item.key)) {
        newExpandedKeys.delete(item.key);
      } else {
        newExpandedKeys.add(item.key);
      }
      setExpandedKeys(newExpandedKeys);
    }
    
    onItemClick?.(item.key, item);
    item.onClick?.();
    
    if (item.href) {
      window.location.href = item.href;
    }
  };

  const renderNavItem = (item: NavigationItem, level = 0) => {
    const isActive = item.key === activeKey;
    const isExpanded = expandedKeys.has(item.key);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.key} className="mobile-menu-item">
        <button
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={twMerge(
            'w-full flex items-center gap-3 px-3 py-2 text-left rounded-[var(--radius-md)] transition-smooth',
            'hover:bg-[var(--color-hover-surface)] focus:bg-[var(--color-hover-surface)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isActive && 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] nav-item-active',
            !isActive && 'text-[var(--color-text)]',
            level > 0 && 'ml-6'
          )}
        >
          {/* Icon */}
          {item.icon && (
            <span className={twMerge(
              'flex-shrink-0 transition-transform',
              isActive && 'scale-110'
            )}>
              {item.icon}
            </span>
          )}
          
          {/* Label */}
          <span className={twMerge(
            'flex-1 font-[var(--font-weight-medium)] truncate',
            collapsed && 'sr-only'
          )}>
            {item.label}
          </span>
          
          {/* Badge */}
          {item.badge && !collapsed && (
            <span className="px-1.5 py-0.5 text-[var(--font-size-xs)] bg-[var(--color-primary)] text-white rounded-full animate-scale-in">
              {item.badge}
            </span>
          )}
          
          {/* Expand Icon */}
          {hasChildren && !collapsed && (
            <svg 
              className={twMerge(
                'w-4 h-4 transition-transform',
                isExpanded && 'rotate-90'
              )} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
        
        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1 table-row-expand">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={twMerge('space-y-1', className)}>
      {items.map(item => renderNavItem(item))}
    </nav>
  );
}