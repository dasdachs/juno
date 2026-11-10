import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders an off switch with its label', () => {
    expect(
      render(<Switch label="Lock when hidden" checked={false} onChange={() => {}} />).asFragment()
    ).toMatchSnapshot();
  });

  it('renders an on switch with supporting text', () => {
    expect(
      render(
        <Switch label="Lock when hidden" supporting="Locks after 30 seconds" checked onChange={() => {}} />
      ).asFragment()
    ).toMatchSnapshot();
  });
});
