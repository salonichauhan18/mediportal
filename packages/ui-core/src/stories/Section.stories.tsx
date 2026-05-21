import type { Meta, StoryObj } from '@storybook/react'
import { Section } from '../components/Section'

const meta: Meta<typeof Section> = {
  title: 'Components/Section',
  component: Section,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Section>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
