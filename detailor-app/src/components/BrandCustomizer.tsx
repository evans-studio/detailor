"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { BrandConfig, validateBrandConfig, applyBrandTheme, removeBrandTheme } from '@/lib/brand-theming';

// Color picker component (simplified - in production use a proper color picker library)
function ColorPicker({ 
  value, 
  onChange, 
  label,
  description 
}: { 
  value: string; 
  onChange: (color: string) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
        {label}
      </label>
      {description && (
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          {description}
        </p>
      )}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] cursor-pointer shadow-inner"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = value;
            input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
            input.click();
          }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3B82F6"
          className="flex-1"
        />
      </div>
    </div>
  );
}

// Preview component showing the brand theme applied
function BrandPreview({ config }: { config: BrandConfig }) {
  return (
    <div className="space-y-4 p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
          Brand Preview
        </h3>
        <Badge variant="secondary">Live Preview</Badge>
      </div>
      
      {/* Header Preview */}
      <div 
        className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]"
        style={{ 
          backgroundColor: config.surfaceColor || 'var(--color-surface)',
          fontFamily: config.fontFamily || 'var(--font-sans)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.brandName?.charAt(0) || 'B'}
          </div>
          <h4 
            className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)]"
            style={{ fontFamily: config.fontFamily || 'inherit' }}
          >
            {config.brandName || 'Your Brand'}
          </h4>
        </div>
      </div>

      {/* Button Preview */}
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded-[var(--radius-md)] text-white font-[var(--font-weight-medium)] text-[var(--font-size-sm)] transition-all hover:opacity-90"
          style={{ backgroundColor: config.primaryColor }}
        >
          Primary Button
        </button>
        <button
          className="px-4 py-2 rounded-[var(--radius-md)] border transition-all hover:bg-opacity-10"
          style={{ 
            borderColor: config.primaryColor,
            color: config.primaryColor,
            backgroundColor: `${config.primaryColor}10`
          }}
        >
          Secondary Button
        </button>
      </div>

      {/* Card Preview */}
      <div 
        className="p-4 rounded-[var(--radius-md)] border"
        style={{ 
          borderColor: config.primaryColor + '20',
          backgroundColor: config.accentColor || `${config.primaryColor}05`
        }}
      >
        <h5 className="font-[var(--font-weight-medium)] text-[var(--color-text)] mb-2">
          Branded Card Component
        </h5>
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          This card shows how your brand colors integrate with the interface.
        </p>
      </div>
    </div>
  );
}

interface BrandCustomizerProps {
  tenantId: string;
  initialConfig?: BrandConfig;
  onSave?: (config: BrandConfig) => Promise<{ success: boolean; error?: string }>;
}

export function BrandCustomizer({ tenantId, initialConfig, onSave }: BrandCustomizerProps) {
  const [config, setConfig] = React.useState<BrandConfig>(
    initialConfig || {
      primaryColor: '#3B82F6',
      secondaryColor: '#F6B500',
      brandName: 'Your Business',
    }
  );
  const [saving, setSaving] = React.useState(false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Validate configuration on change
  React.useEffect(() => {
    const validation = validateBrandConfig(config);
    setValidationErrors(validation.errors);
  }, [config]);

  // Apply preview theming
  React.useEffect(() => {
    if (previewMode) {
      applyBrandTheme(config);
    } else {
      removeBrandTheme();
    }
    
    return () => {
      if (previewMode) {
        removeBrandTheme();
      }
    };
  }, [config, previewMode]);

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      return;
    }

    setSaving(true);
    try {
      const result = onSave ? await onSave(config) : { success: true };
      
      if (result.success) {
        // Success feedback - you could add toast notification here
        console.log('Brand configuration saved successfully');
      } else {
        console.error('Failed to save brand configuration:', result.error);
      }
    } catch (error) {
      console.error('Error saving brand configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      primaryColor: '#3B82F6',
      secondaryColor: '#F6B500', 
      brandName: 'Your Business',
    });
    setPreviewMode(false);
    removeBrandTheme();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
            Brand Customization
          </h2>
          <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] mt-1">
            Customize your dashboard with your brand identity
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            intent="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Exit Preview' : 'Preview Changes'}
          </Button>
          <Button
            intent="ghost"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            intent="primary"
            onClick={handleSave}
            loading={saving}
            loadingText="Saving..."
            disabled={validationErrors.length > 0}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-error-50)] border border-[var(--color-error)] text-[var(--color-error-900)]">
          <h4 className="font-[var(--font-weight-medium)] mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-[var(--font-size-sm)]">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="colors" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>
                    Define your brand colors that will be applied throughout the interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ColorPicker
                    label="Primary Color"
                    description="Main brand color used for buttons, links, and active states"
                    value={config.primaryColor}
                    onChange={(color) => setConfig(prev => ({ ...prev, primaryColor: color }))}
                  />
                  
                  <ColorPicker
                    label="Secondary Color"
                    description="Supporting brand color for accents and highlights"
                    value={config.secondaryColor || ''}
                    onChange={(color) => setConfig(prev => ({ ...prev, secondaryColor: color }))}
                  />
                  
                  <ColorPicker
                    label="Accent Color"
                    description="Subtle accent color for backgrounds and borders"
                    value={config.accentColor || ''}
                    onChange={(color) => setConfig(prev => ({ ...prev, accentColor: color }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="typography" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>
                    Customize fonts and text styling to match your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
                      Font Family
                    </label>
                    <Input
                      type="text"
                      placeholder="Inter, system-ui, sans-serif"
                      value={config.fontFamily || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
                      Border Radius Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['minimal', 'normal', 'rounded', 'circular'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, borderRadius: style }))}
                          className={`
                            p-3 border rounded-[var(--radius-md)] text-left transition-all
                            ${config.borderRadius === style 
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]' 
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                            }
                          `}
                        >
                          <div className="font-[var(--font-weight-medium)] capitalize">{style}</div>
                          <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                            {style === 'minimal' && '2px radius'}
                            {style === 'normal' && '8px radius'}
                            {style === 'rounded' && '12px radius'} 
                            {style === 'circular' && 'Fully rounded'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assets" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Assets</CardTitle>
                  <CardDescription>
                    Upload your logo and customize brand identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
                      Brand Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Your Business Name"
                      value={config.brandName || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, brandName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
                      Logo URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={config.logoUrl || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text)]">
                      Favicon URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/favicon.ico"
                      value={config.faviconUrl || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, faviconUrl: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div>
          <BrandPreview config={config} />
        </div>
      </div>
    </div>
  );
}