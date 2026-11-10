import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Fab } from './Fab';

describe('Fab', () => {
  it('renders an extended FAB with a label', () => {
    expect(render(<Fab icon="add" label="Log today" />).asFragment()).toMatchSnapshot();
  });

  it('renders an icon-only FAB', () => {
    expect(render(<Fab icon="add" aria-label="Add entry" />).asFragment()).toMatchSnapshot();
  });
});
