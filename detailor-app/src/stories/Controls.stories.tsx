import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Checkbox } from '@/ui/checkbox';
import { Switch } from '@/ui/switch';
import { Badge } from '@/ui/badge';
import { Tooltip } from '@/ui/tooltip';

const meta: Meta = {
  title: 'UI/Atoms/Controls',
};
export default meta;
type Story = StoryObj;

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button intent="primary">Primary</Button>
        <Button intent="secondary">Secondary</Button>
        <Button intent="ghost">Ghost</Button>
        <Button intent="destructive">Destructive</Button>
        <Button intent="link">Link</Button>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input placeholder="Input" style={{ width: 220 }} />
        <Checkbox defaultChecked />
        <Switch defaultChecked />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge>Default</Badge>
        <Badge intent="success">Success</Badge>
        <Badge intent="warning">Warning</Badge>
        <Badge intent="error">Error</Badge>
        <Badge intent="info">Info</Badge>
      </div>
      <div>
        <Tooltip content="Token-based tooltip">
          <Button intent="ghost">Hover me</Button>
        </Tooltip>
      </div>
    </div>
  ),
};


