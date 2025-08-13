/**
 * Detailor Brand Consistency Validation
 * Utility functions to ensure consistent brand application across all touchpoints
 */

import { detailorTheme } from './theme';

export const brandValidation = {
  /**
   * Check if a color value is part of the approved brand palette
   */
  isValidBrandColor: (color: string): boolean => {
    const brandColors = Object.values(detailorTheme.colors.brand);
    const neutralColors = Object.values(detailorTheme.colors.neutral);
    const allValidColors = [
      ...brandColors,
      ...neutralColors,
      detailorTheme.colors.success,
      detailorTheme.colors.warning,
      detailorTheme.colors.accent,
    ];
    return allValidColors.includes(color);
  },

  /**
   * Get consistent spacing value from the design system
   */
  getSpacing: (key: keyof typeof detailorTheme.spacing): string => {
    return detailorTheme.spacing[key];
  },

  /**
   * Get consistent typography values from the design system
   */
  getTypography: (size: keyof typeof detailorTheme.typography.fontSizes, weight?: keyof typeof detailorTheme.typography.fontWeights): string => {
    const fontSize = detailorTheme.typography.fontSizes[size];
    const fontWeight = weight ? detailorTheme.typography.fontWeights[weight] : detailorTheme.typography.fontWeights.normal;
    return `font-size: ${fontSize}; font-weight: ${fontWeight}; font-family: ${detailorTheme.typography.fontFamily};`;
  },

  /**
   * Validate brand-compliant component props
   */
  validateComponentProps: (props: Record<string, any>): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check for deprecated color props
    if (props.color && !brandValidation.isValidBrandColor(props.color)) {
      issues.push(`Invalid color: ${props.color}. Use brand-approved colors from detailorTheme.`);
    }
    
    // Check for consistent border radius usage
    const validRadii = Object.values(detailorTheme.borderRadius);
    if (props.borderRadius && !validRadii.includes(props.borderRadius)) {
      issues.push(`Invalid border radius: ${props.borderRadius}. Use values from detailorTheme.borderRadius.`);
    }
    
    // Check for consistent shadow usage
    const validShadows = Object.values(detailorTheme.shadows);
    if (props.boxShadow && !validShadows.includes(props.boxShadow)) {
      issues.push(`Invalid shadow: ${props.boxShadow}. Use values from detailorTheme.shadows.`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  },

  /**
   * Generate brand-compliant CSS custom properties
   */
  generateCSSVariables: (): string => {
    let css = ':root {\n';
    
    // Brand colors
    Object.entries(detailorTheme.colors.brand).forEach(([key, value]) => {
      css += `  --brand-${key}: ${value};\n`;
    });
    
    // Neutral colors
    Object.entries(detailorTheme.colors.neutral).forEach(([key, value]) => {
      css += `  --neutral-${key}: ${value};\n`;
    });
    
    // Typography
    Object.entries(detailorTheme.typography.fontSizes).forEach(([key, value]) => {
      css += `  --font-size-${key}: ${value};\n`;
    });
    
    Object.entries(detailorTheme.typography.fontWeights).forEach(([key, value]) => {
      css += `  --font-weight-${key}: ${value};\n`;
    });
    
    // Spacing
    Object.entries(detailorTheme.spacing).forEach(([key, value]) => {
      css += `  --space-${key}: ${value};\n`;
    });
    
    // Border radius
    Object.entries(detailorTheme.borderRadius).forEach(([key, value]) => {
      css += `  --radius-${key}: ${value};\n`;
    });
    
    // Shadows
    Object.entries(detailorTheme.shadows).forEach(([key, value]) => {
      css += `  --shadow-${key}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  },

  /**
   * Brand consistency checklist for development teams
   */
  getBrandChecklist: () => ({
    colors: {
      title: 'Color Consistency',
      items: [
        '✅ Primary brand colors (blue variants) are used consistently',
        '✅ Neutral colors follow the defined scale',
        '✅ Success, warning, and accent colors are used appropriately',
        '✅ No hardcoded colors outside the brand palette',
      ]
    },
    typography: {
      title: 'Typography Consistency',
      items: [
        '✅ Inter font family is used throughout',
        '✅ Font sizes follow the modular scale',
        '✅ Font weights are consistent (300, 400, 500, 600, 700, 800)',
        '✅ Line heights are appropriate for readability',
      ]
    },
    spacing: {
      title: 'Spacing Consistency',
      items: [
        '✅ 8px grid system is followed',
        '✅ Consistent padding and margins using design tokens',
        '✅ Responsive spacing adjustments are in place',
      ]
    },
    components: {
      title: 'Component Consistency',
      items: [
        '✅ Border radius values are consistent',
        '✅ Shadow system is applied uniformly',
        '✅ Animation durations and easing are standardized',
        '✅ Interactive states (hover, focus, active) are consistent',
      ]
    },
    responsiveness: {
      title: 'Mobile-First Responsiveness',
      items: [
        '✅ Mobile breakpoints are defined and used',
        '✅ Touch-friendly interface elements (44px minimum)',
        '✅ Appropriate content hierarchy on all screen sizes',
        '✅ Consistent spacing across breakpoints',
      ]
    },
    accessibility: {
      title: 'Accessibility Compliance',
      items: [
        '✅ Color contrast ratios meet WCAG standards',
        '✅ Focus states are visible and consistent',
        '✅ Reduced motion preferences are respected',
        '✅ Semantic HTML and ARIA attributes are used',
      ]
    }
  }),

  /**
   * Generate component class names using brand tokens
   */
  getComponentClasses: {
    button: (variant: 'primary' | 'secondary' | 'ghost' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
      const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-500/30 button-press';
      
      const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
        secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm hover:shadow-md',
        ghost: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
      };

      const sizeClasses = {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-13 px-6 text-lg'
      };

      return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
    },

    card: (variant: 'default' | 'elevated' | 'interactive' = 'default') => {
      const baseClasses = 'bg-white rounded-xl border border-gray-200';
      
      const variantClasses = {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        interactive: 'shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover-lift'
      };

      return `${baseClasses} ${variantClasses[variant]}`;
    },

    input: (hasError = false) => {
      const baseClasses = 'w-full h-11 px-4 rounded-xl border bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-500/30';
      const errorClasses = hasError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500';
      
      return `${baseClasses} ${errorClasses}`;
    }
  }
};

/**
 * Brand consistency hooks for React components
 */
export const useBrandConsistency = () => {
  const checkConsistency = (element: HTMLElement): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    // Check computed styles
    const computedStyles = window.getComputedStyle(element);
    
    // Check for non-brand colors
    const color = computedStyles.color;
    const backgroundColor = computedStyles.backgroundColor;
    
    if (color && !brandValidation.isValidBrandColor(color)) {
      issues.push(`Non-brand text color detected: ${color}`);
      score -= 10;
    }
    
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && !brandValidation.isValidBrandColor(backgroundColor)) {
      issues.push(`Non-brand background color detected: ${backgroundColor}`);
      score -= 10;
    }

    // Check font family
    const fontFamily = computedStyles.fontFamily;
    if (!fontFamily.includes('Inter')) {
      issues.push(`Non-brand font family detected: ${fontFamily}`);
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  };

  return { checkConsistency };
};

export default brandValidation;