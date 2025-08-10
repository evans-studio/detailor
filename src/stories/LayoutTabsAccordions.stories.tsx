import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/ui/accordion';
import { ScrollArea } from '@/ui/scroll-area';

const meta: Meta = {
  title: 'UI/Layout/Tabs & Accordion & Scroll',
};
export default meta;
type Story = StoryObj;

export const Examples: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Tab One</TabsContent>
        <TabsContent value="two">Tab Two</TabsContent>
      </Tabs>

      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>Content A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>Content B</AccordionContent>
        </AccordionItem>
      </Accordion>

      <ScrollArea className="h-24 border border-[var(--color-border)] rounded-[var(--radius-sm)]">
        <div style={{ height: 200, padding: 8 }}>Scrollable Content</div>
      </ScrollArea>
    </div>
  ),
};


