import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a decorative Material Symbol', () => {
    expect(render(<Icon name="calendar_month" />).asFragment()).toMatchSnapshot();
  });

  it('renders a large filled symbol', () => {
    expect(render(<Icon name="favorite" size="large" filled />).asFragment()).toMatchSnapshot();
  });
});
