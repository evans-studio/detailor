/**
 * Dynamic Brand Theming System
 * Enterprise-grade tenant customization
 */

export interface BrandConfig {
  // Primary brand identity
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  
  // Typography
  fontFamily?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  
  // Logo and imagery
  logoUrl?: string;
  faviconUrl?: string;
  brandName?: string;
  
  // Surface customization
  surfaceColor?: string;
  borderRadius?: 'minimal' | 'normal' | 'rounded' | 'circular';
  
  // Advanced theming
  customCss?: string;
  darkModeEnabled?: boolean;
}

export interface BrandTokens {
  '--brand-primary': string;
  '--brand-secondary': string;
  '--brand-accent': string;
  '--brand-surface': string;
  '--brand-text': string;
  '--brand-font-family'?: string;
  '--brand-radius'?: string;
}

/**
 * Generate CSS custom properties from brand configuration
 */
export function generateBrandTokens(config: BrandConfig): BrandTokens {
  const tokens: BrandTokens = {
    '--brand-primary': config.primaryColor,
    '--brand-secondary': config.secondaryColor || config.primaryColor,
    '--brand-accent': config.accentColor || `${config.primaryColor}20`, // 20% opacity
    '--brand-surface': config.surfaceColor || 'var(--color-surface)',
    '--brand-text': 'var(--color-text)',
  };

  // Typography tokens
  if (config.fontFamily) {
    tokens['--brand-font-family'] = config.fontFamily;
  }

  // Border radius mapping
  if (config.borderRadius) {
    const radiusMap = {
      minimal: 'var(--radius-xs)',
      normal: 'var(--radius-md)', 
      rounded: 'var(--radius-lg)',
      circular: 'var(--radius-full)',
    };
    tokens['--brand-radius'] = radiusMap[config.borderRadius];
  }

  return tokens;
}

/**
 * Apply brand theming to the DOM
 */
export function applyBrandTheme(config: BrandConfig): void {
  const tokens = generateBrandTokens(config);
  const root = document.documentElement;

  // Apply CSS custom properties
  Object.entries(tokens).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Apply custom CSS if provided
  if (config.customCss) {
    let styleElement = document.getElementById('brand-custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'brand-custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = config.customCss;
  }

  // Update favicon if provided
  if (config.faviconUrl) {
    updateFavicon(config.faviconUrl);
  }

  // Update document title if brand name provided
  if (config.brandName && typeof document !== 'undefined') {
    document.title = `${config.brandName} - Detailor Platform`;
  }
}

/**
 * Remove brand theming and restore defaults
 */
export function removeBrandTheme(): void {
  const root = document.documentElement;
  const brandProperties = [
    '--brand-primary',
    '--brand-secondary', 
    '--brand-accent',
    '--brand-surface',
    '--brand-text',
    '--brand-font-family',
    '--brand-radius',
  ];

  brandProperties.forEach(property => {
    root.style.removeProperty(property);
  });

  // Remove custom CSS
  const styleElement = document.getElementById('brand-custom-css');
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * Update favicon dynamically
 */
function updateFavicon(faviconUrl: string): void {
  const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (existingFavicon) {
    existingFavicon.href = faviconUrl;
  } else {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/x-icon';
    favicon.href = faviconUrl;
    document.head.appendChild(favicon);
  }
}

/**
 * Validate brand configuration
 */
export function validateBrandConfig(config: BrandConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate primary color format
  if (!isValidColor(config.primaryColor)) {
    errors.push('Primary color must be a valid CSS color value');
  }

  // Validate secondary color if provided
  if (config.secondaryColor && !isValidColor(config.secondaryColor)) {
    errors.push('Secondary color must be a valid CSS color value');
  }

  // Validate accent color if provided
  if (config.accentColor && !isValidColor(config.accentColor)) {
    errors.push('Accent color must be a valid CSS color value');
  }

  // Validate URLs if provided
  if (config.logoUrl && !isValidUrl(config.logoUrl)) {
    errors.push('Logo URL must be a valid URL');
  }

  if (config.faviconUrl && !isValidUrl(config.faviconUrl)) {
    errors.push('Favicon URL must be a valid URL');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a string is a valid CSS color
 */
function isValidColor(color: string): boolean {
  const option = new Option().style;
  option.color = color;
  return option.color !== '';
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate accessible color variations
 */
export function generateColorPalette(baseColor: string): {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
} {
  // This is a simplified implementation
  // In a real-world scenario, you'd use a color manipulation library
  // like chroma.js or polished to generate proper color variations
  
  const variations = {
    50: lighten(baseColor, 0.45),
    100: lighten(baseColor, 0.35),
    200: lighten(baseColor, 0.25),
    300: lighten(baseColor, 0.15),
    400: lighten(baseColor, 0.05),
    500: baseColor, // Base color
    600: darken(baseColor, 0.05),
    700: darken(baseColor, 0.15),
    800: darken(baseColor, 0.25),
    900: darken(baseColor, 0.35),
  };

  return variations;
}

// Utility functions for color manipulation
function lighten(color: string, amount: number): string {
  // Simplified implementation - in production, use a proper color library
  return color;
}

function darken(color: string, amount: number): string {
  // Simplified implementation - in production, use a proper color library  
  return color;
}

/**
 * Get brand configuration for a tenant
 */
export async function getBrandConfigForTenant(tenantId: string): Promise<BrandConfig | null> {
  try {
    const response = await fetch(`/api/tenants/${tenantId}/branding`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch brand configuration:', error);
    return null;
  }
}

/**
 * Save brand configuration for a tenant
 */
export async function saveBrandConfigForTenant(
  tenantId: string, 
  config: BrandConfig
): Promise<{ success: boolean; error?: string }> {
  // Validate configuration first
  const validation = validateBrandConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(', ')
    };
  }

  try {
    const response = await fetch(`/api/tenants/${tenantId}/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Failed to save brand configuration: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Brand theming hook for React components
 */
export function useBrandTheming(tenantId?: string) {
  const [brandConfig, setBrandConfig] = React.useState<BrandConfig | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tenantId) return;

    const loadBrandConfig = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const config = await getBrandConfigForTenant(tenantId);
        setBrandConfig(config);
        
        if (config) {
          applyBrandTheme(config);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brand configuration');
      } finally {
        setLoading(false);
      }
    };

    loadBrandConfig();

    // Cleanup on unmount
    return () => {
      removeBrandTheme();
    };
  }, [tenantId]);

  const updateBrandConfig = async (newConfig: BrandConfig) => {
    if (!tenantId) return { success: false, error: 'No tenant ID provided' };

    setLoading(true);
    const result = await saveBrandConfigForTenant(tenantId, newConfig);
    
    if (result.success) {
      setBrandConfig(newConfig);
      applyBrandTheme(newConfig);
    } else {
      setError(result.error || 'Failed to update brand configuration');
    }
    
    setLoading(false);
    return result;
  };

  return {
    brandConfig,
    loading,
    error,
    updateBrandConfig,
  };
}

// Re-export React for the hook
import * as React from 'react';