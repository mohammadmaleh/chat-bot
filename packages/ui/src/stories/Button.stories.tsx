import { Button } from '../components/primitives/button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;

export const Default = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Ghost = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Link = {
  args: {
    children: 'Link',
    variant: 'link',
  },
};

export const Small = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Large = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

export const Icon = {
  args: {
    children: '🚀',
    size: 'icon',
  },
};
