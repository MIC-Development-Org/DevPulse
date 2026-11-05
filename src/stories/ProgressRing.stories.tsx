import type { Meta, StoryObj } from "@storybook/react";
import { ProgressRing } from "@/components/ui/progress-ring";

const meta: Meta<typeof ProgressRing> = {
  title: "Feedback/ProgressRing",
  component: ProgressRing,
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    color: {
      control: "select",
      options: ["mint", "blue", "amber", "emerald", "rose"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

export const DefaultMint: Story = {
  args: {
    value: 80,
    color: "mint",
    size: 130,
  },
};

export const PassedMastery: Story = {
  args: {
    value: 100,
    color: "emerald",
    size: 140,
  },
};

export const NeedsPractice: Story = {
  args: {
    value: 62.5,
    color: "rose",
    size: 140,
  },
};

