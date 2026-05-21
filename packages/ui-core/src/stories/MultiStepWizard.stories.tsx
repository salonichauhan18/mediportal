import type { Meta, StoryObj } from '@storybook/react'
import { MultiStepWizard } from '../components/MultiStepWizard'

const meta: Meta<typeof MultiStepWizard> = {
  title: 'Components/MultiStepWizard',
  component: MultiStepWizard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MultiStepWizard>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
