import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FormRow } from '@/ui/form-row';
import { Input } from '@/ui/input';
import { Textarea } from '@/ui/textarea';
import { Alert } from '@/ui/alert';

const meta: Meta = {
  title: 'UI/Forms/Examples',
};
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 420 }}>
      <Alert intent="info">Form uses tokenized spacing, radius, and focus styles.</Alert>
      <FormRow label="Name" help="Your full name">
        <Input placeholder="Jane Doe" />
      </FormRow>
      <FormRow label="Message" error="Message is required">
        <Textarea placeholder="How can we help?" />
      </FormRow>
    </div>
  ),
};


