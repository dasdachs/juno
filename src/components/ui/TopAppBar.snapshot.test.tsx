import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TopAppBar } from './TopAppBar';
import { IconButton } from './IconButton';

describe('TopAppBar', () => {
  it('renders title, leading slot and actions', () => {
    expect(
      render(
        <TopAppBar title="Juno" leading={<span>J</span>} actions={<IconButton icon="lock" label="Lock app" />} />
      ).asFragment()
    ).toMatchSnapshot();
  });
});
