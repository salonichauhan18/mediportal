import type { Meta, StoryObj } from '@storybook/react'
import { Toast } from '../components/Toast'

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Toast>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
