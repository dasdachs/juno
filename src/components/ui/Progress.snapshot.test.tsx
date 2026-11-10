import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('renders an inline indicator with the default label', () => {
    expect(render(<Progress />).asFragment()).toMatchSnapshot();
  });

  it('renders a full-screen indicator with a custom label', () => {
    expect(render(<Progress fullScreen label="Unlocking..." />).asFragment()).toMatchSnapshot();
  });
});
