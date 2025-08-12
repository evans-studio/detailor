import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/ui/button';
import { Plus } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Atoms/Button',
  component: Button,
  args: {
    children: 'Button',
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { intent: 'primary' } };
export const Secondary: Story = { args: { intent: 'secondary' } };
export const Ghost: Story = { args: { intent: 'ghost' } };
export const Destructive: Story = { args: { intent: 'destructive' } };
export const Link: Story = { args: { intent: 'link' } };
export const WithIcon: Story = { args: { intent: 'primary', leadingIcon: <Plus size={16} /> } };


