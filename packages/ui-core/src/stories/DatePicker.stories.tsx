import type { Meta, StoryObj } from '@storybook/react'
import { DatePicker } from '../components/DatePicker'

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
