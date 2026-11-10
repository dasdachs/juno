import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders a filled button by default', () => {
    expect(render(<Button>Save</Button>).asFragment()).toMatchSnapshot();
  });

  it.each(['tonal', 'outlined', 'text', 'danger', 'danger-text'] as const)(
    'renders the %s variant',
    (variant) => {
      expect(render(<Button variant={variant}>Action</Button>).asFragment()).toMatchSnapshot();
    }
  );

  it('renders a full-width button with a leading icon', () => {
    expect(
      render(<Button icon="download" fullWidth>Export</Button>).asFragment()
    ).toMatchSnapshot();
  });

  it('renders a disabled button', () => {
    expect(render(<Button disabled>Save</Button>).asFragment()).toMatchSnapshot();
  });
});
