import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from '../components/Switch'

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
