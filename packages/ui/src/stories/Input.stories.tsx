import { Input } from '../components/primitives/input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

export const Default = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Disabled = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithValue = {
  args: {
    value: 'Hello World',
  },
};

export const Email = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const Password = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};
