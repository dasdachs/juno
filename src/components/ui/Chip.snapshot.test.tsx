import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders a static label chip', () => {
    expect(render(<Chip icon="cycle">Cycle Day 3</Chip>).asFragment()).toMatchSnapshot();
  });

  it('renders an unselected filter chip', () => {
    expect(
      render(<Chip selected={false} onClick={() => {}}>Mood</Chip>).asFragment()
    ).toMatchSnapshot();
  });

  it('renders a selected filter chip with a check', () => {
    expect(render(<Chip selected onClick={() => {}}>Mood</Chip>).asFragment()).toMatchSnapshot();
  });
});
