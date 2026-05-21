import type { Meta, StoryObj } from '@storybook/react'
import { FormMessage } from '../components/FormMessage'

const meta: Meta<typeof FormMessage> = {
  title: 'Components/FormMessage',
  component: FormMessage,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof FormMessage>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
