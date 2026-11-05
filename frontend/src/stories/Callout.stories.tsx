import type { Meta, StoryObj } from "@storybook/react";
import { Callout } from "@/components/reader/callout";

const meta: Meta<typeof Callout> = {
  title: "Reader/Callout",
  component: Callout,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["tip", "mistake", "warning", "note"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const ProTip: Story = {
  args: {
    type: "tip",
    title: "The Content-Addressable Invariant",
    children: "If two files have identical byte contents, Git stores only one single blob object on disk.",
  },
};

export const CommonMistake: Story = {
  args: {
    type: "mistake",
    title: "Running 'git rebase' on Shared Remote Branches",
    children: "Rebasing rewrites commit hashes and causes history divergence for teammates.",
  },
};

