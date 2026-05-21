const fs = require('fs');
const path = require('path');

const components = [
  'Button', 'Input', 'Textarea', 'Select', 'Checkbox', 'RadioGroup', 
  'Switch', 'DatePicker', 'Slider', 'FormField', 'FormMessage', 
  'MultiStepWizard', 'Alert', 'Modal', 'Toast', 'Skeleton', 
  'Progress', 'Spinner', 'Card', 'Table', 'Badge', 'Avatar', 
  'Accordion', 'Tooltip', 'DropdownMenu', 'Tabs', 'Pagination', 
  'Container', 'Section', 'Grid', 'Flex', 'Divider', 'Heading', 'Text', 'Label'
];

const componentsDir = path.join(__dirname, 'packages', 'ui-core', 'src', 'components');
const storiesDir = path.join(__dirname, 'packages', 'ui-core', 'src', 'stories');

// Ensure directories exist
fs.mkdirSync(componentsDir, { recursive: true });
fs.mkdirSync(storiesDir, { recursive: true });

let indexExports = '';

components.forEach(cmp => {
  const isForm = ['Input', 'Textarea', 'Select', 'Checkbox', 'RadioGroup', 'Switch', 'DatePicker', 'Slider', 'FormField', 'FormMessage', 'MultiStepWizard'].includes(cmp);
  const type = isForm ? 'forms' : 'ui';

  const cmpPath = path.join(componentsDir, `${cmp}.tsx`);
  const storyPath = path.join(storiesDir, `${cmp}.stories.tsx`);

  // Stub Component
  const cmpContent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface ${cmp}Props extends React.HTMLAttributes<HTMLDivElement> {}

export const ${cmp} = React.forwardRef<HTMLDivElement, ${cmp}Props>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-${cmp.toLowerCase()}-classes", className)} {...props}>
        ${cmp} Component
      </div>
    )
  }
)
${cmp}.displayName = "${cmp}"
`;

  // Stub Story
  const storyContent = `import type { Meta, StoryObj } from '@storybook/react'
import { ${cmp} } from '../components/${cmp}'

const meta: Meta<typeof ${cmp}> = {
  title: 'Components/${cmp}',
  component: ${cmp},
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ${cmp}>

export const Default: Story = {
  args: {},
}

export const Hover: Story = {
  args: { className: "hover:bg-primary/90" },
}

export const Disabled: Story = {
  args: { className: "opacity-50 cursor-not-allowed" },
}
`;

  fs.writeFileSync(cmpPath, cmpContent);
  fs.writeFileSync(storyPath, storyContent);

  indexExports += `export * from './components/${cmp}';\n`;
});

// Image Wrapper
const imgPath = path.join(componentsDir, 'AccessibleImage.tsx');
fs.writeFileSync(imgPath, `import * as React from "react"
import { cn } from "@/lib/utils"

export interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string; // Enforce alt prop
}

export const AccessibleImage = React.forwardRef<HTMLImageElement, AccessibleImageProps>(
  ({ className, alt, ...props }, ref) => {
    return (
      <img ref={ref} className={cn("", className)} alt={alt} {...props} />
    )
  }
)
AccessibleImage.displayName = "AccessibleImage"
`);
indexExports += `export * from './components/AccessibleImage';\n`;

const indexPath = path.join(__dirname, 'packages', 'ui-core', 'src', 'index.ts');
fs.writeFileSync(indexPath, indexExports);

console.log('Successfully generated UI components and stories.');
