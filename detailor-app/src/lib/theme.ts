/**
 * Detailor Brand Theme Configuration
 * Provides programmatic access to brand tokens and utilities
 */

export const detailorTheme = {
  colors: {
    brand: {
      primary: '#3B82F6',
      primaryHover: '#2563EB',
      primaryLight: '#60A5FA',
      blue50: '#EFF6FF',
      blue100: '#DBEAFE',
      blue900: '#1E3A8A',
    },
    success: '#10B981',
    warning: '#F59E0B',
    accent: '#F59E0B',
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    }
  },

  gradients: {
    primary: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    accent: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    subtle: 'linear-gradient(135deg, #EFF6FF 0%, rgba(59, 130, 246, 0.05) 100%)',
    hero: 'linear-gradient(135deg, #FAFAFA 0%, rgba(59, 130, 246, 0.08) 30%, rgba(16, 185, 129, 0.03) 70%, #FAFAFA 100%)',
  },

  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    }
  },

  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    brand: '0 4px 6px rgba(59, 130, 246, 0.07)',
    brandLg: '0 10px 15px rgba(59, 130, 246, 0.1)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
  },

  animations: {
    durations: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    easings: {
      inOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
      outExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    }
  },

  components: {
    button: {
      heights: {
        sm: '36px',
        md: '44px',
        lg: '52px',
      },
      paddingX: {
        sm: '0.75rem',
        md: '1.25rem',
        lg: '1.5rem',
      }
    },
    input: {
      height: '44px',
      paddingX: '1rem',
      borderRadius: '12px',
    },
    card: {
      padding: '1.5rem',
      borderRadius: '16px',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
    nav: {
      height: '64px',
      paddingX: '1.5rem',
    }
  }
} as const;

/**
 * Utility functions for brand consistency
 */
export const brandUtils = {
  /**
   * Get a consistent button class string
   */
  getButtonClasses: (variant: 'primary' | 'secondary' | 'ghost' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-250 focus:outline-none focus:ring-3 focus:ring-[var(--color-primary)]/30';
    
    const variantClasses = {
      primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-hover-primary)] text-[var(--color-primary-foreground)] shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
      secondary: 'bg-[var(--color-surface)] hover:bg-[var(--color-hover-surface)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm hover:shadow-md',
      ghost: 'text-[var(--color-primary)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)]'
    };

    const sizeClasses = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-base',
      lg: 'h-13 px-6 text-lg'
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  },

  /**
   * Get a consistent input class string
   */
  getInputClasses: (hasError = false) => {
    const baseClasses = 'w-full h-11 px-4 rounded-lg border bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-[var(--color-primary)]/30';
    const errorClasses = hasError ? 'border-[var(--color-error-300)] focus:border-[var(--color-error-500)]' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]';
    
    return `${baseClasses} ${errorClasses}`;
  },

  /**
   * Get a consistent card class string
   */
  getCardClasses: (interactive = false) => {
    const baseClasses = 'bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-md';
    const interactiveClasses = interactive ? 'hover:shadow-lg transition-shadow duration-250 cursor-pointer' : '';
    
    return `${baseClasses} ${interactiveClasses}`;
  },

  /**
   * Generate brand gradient styles
   */
  getBrandGradient: (type: keyof typeof detailorTheme.gradients = 'primary') => ({
    background: detailorTheme.gradients[type]
  }),

  /**
   * Get semantic colors for different contexts
   */
  getStatusColor: (status: 'success' | 'warning' | 'error' | 'info') => {
    const colors = {
      success: detailorTheme.colors.success,
      warning: detailorTheme.colors.warning,
      error: 'var(--color-error)',
      info: 'var(--color-primary)'
    };
    return colors[status];
  }
};

/**
 * Type-safe access to theme tokens
 */
export type DetailorTheme = typeof detailorTheme;
export type BrandColors = keyof typeof detailorTheme.colors.brand;
export type NeutralColors = keyof typeof detailorTheme.colors.neutral;
export type FontSizes = keyof typeof detailorTheme.typography.fontSizes;