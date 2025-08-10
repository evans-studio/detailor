import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';

const meta: Meta<typeof Card> = {
  title: 'UI/Layout/Card',
  component: Card,
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        This is a card using token-driven colours, radius, and shadows.
      </CardContent>
    </Card>
  ),
};


