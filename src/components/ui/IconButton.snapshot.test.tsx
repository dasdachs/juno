import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders a standard icon button with an accessible name', () => {
    expect(render(<IconButton icon="lock" label="Lock app" />).asFragment()).toMatchSnapshot();
  });

  it('renders the tonal variant', () => {
    expect(
      render(<IconButton icon="edit" label="Edit" variant="tonal" />).asFragment()
    ).toMatchSnapshot();
  });
});
