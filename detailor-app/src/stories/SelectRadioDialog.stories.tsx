import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select } from '@/ui/select';
import { RadioGroup } from '@/ui/radio-group';
import { Button } from '@/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/ui/dialog';

const meta: Meta = {
  title: 'UI/Atoms/Select & Radio & Dialog',
};
export default meta;
type Story = StoryObj;

export const Examples: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Select
        options={[
          { label: 'Small', value: 'S' },
          { label: 'Medium', value: 'M' },
          { label: 'Large', value: 'L' },
        ]}
      />
      <RadioGroup
        defaultValue="s"
        options={[
          { label: 'Option S', value: 's' },
          { label: 'Option M', value: 'm' },
        ]}
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Token-based Dialog</DialogTitle>
          <DialogDescription>Uses surface, border, and shadow tokens.</DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  ),
};


