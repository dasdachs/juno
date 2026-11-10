import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('renders a selected radio with its label', () => {
    expect(
      render(<Radio label="Monday" name="week" value="1" checked onChange={() => {}} />).asFragment()
    ).toMatchSnapshot();
  });
});
