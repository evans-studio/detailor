import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Progress } from '@/ui/progress';

const meta: Meta<typeof Progress> = {
  title: 'UI/Atoms/Progress',
  component: Progress,
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Fifty: Story = { args: { value: 50 } };
export const Ninety: Story = { args: { value: 90 } };


