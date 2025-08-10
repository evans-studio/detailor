import type { Preview } from '@storybook/nextjs-vite'

const applyPalette = async (name: 'Master' | 'Luxury' | 'Bold') => {
  const map: Record<string, string> = {
    Master: '/src/styles/palettes/master.json',
    Luxury: '/src/styles/palettes/luxury.json',
    Bold: '/src/styles/palettes/bold.json',
  };
  const res = await fetch(map[name]);
  const json = await res.json();
  const root = document.documentElement;
  // brand
  root.style.setProperty('--color-primary', json.brand['primary']);
  root.style.setProperty('--color-primary-foreground', json.brand['primary-foreground']);
  root.style.setProperty('--color-secondary', json.brand['secondary']);
  root.style.setProperty('--color-secondary-foreground', json.brand['secondary-foreground']);
  // neutrals/text
  root.style.setProperty('--color-bg', json.neutrals['bg']);
  root.style.setProperty('--color-surface', json.neutrals['surface']);
  root.style.setProperty('--color-border', json.neutrals['border']);
  root.style.setProperty('--color-muted', json.neutrals['muted']);
  root.style.setProperty('--color-muted-foreground', json.neutrals['muted-foreground']);
  root.style.setProperty('--color-text', json.text['text']);
  root.style.setProperty('--color-text-muted', json.text['text-muted']);
  root.style.setProperty('--color-inverse-text', json.text['inverse-text']);
  // status
  root.style.setProperty('--color-success', json.status['success']);
  root.style.setProperty('--color-success-foreground', json.status['success-foreground']);
  root.style.setProperty('--color-warning', json.status['warning']);
  root.style.setProperty('--color-warning-foreground', json.status['warning-foreground']);
  root.style.setProperty('--color-error', json.status['error']);
  root.style.setProperty('--color-error-foreground', json.status['error-foreground']);
  root.style.setProperty('--color-info', json.status['info']);
  root.style.setProperty('--color-info-foreground', json.status['info-foreground']);
  // states
  root.style.setProperty('--color-focus-ring', json.states['focus-ring']);
  root.style.setProperty('--color-selection', json.states['selection']);
  root.style.setProperty('--color-hover-surface', json.states['hover-surface']);
};

export const decorators = [
  (Story, context) => {
    const theme = (context.globals as any).palette || 'Master';
    // Fire and forget; SB re-renders after globals change
    applyPalette(theme as any);
    return Story();
  },
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
  globalTypes: {
    palette: {
      name: 'Palette',
      description: 'Theme palette',
      defaultValue: 'Master',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'Master', title: 'Master' },
          { value: 'Luxury', title: 'Luxury' },
          { value: 'Bold', title: 'Bold' },
        ],
      },
    },
  },
};

export default preview;