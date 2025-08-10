import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import { Separator } from '@/ui/separator';
import { Spinner } from '@/ui/spinner';

const meta: Meta = {
  title: 'UI/Atoms/Text & Misc',
};
export default meta;
type Story = StoryObj;

export const Fields: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <Input placeholder="Email" />
      <Textarea placeholder="Message" />
      <Separator />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Spinner /> Loading
      </div>
    </div>
  ),
};


