import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Notice } from './Notice';

describe('Notice', () => {
  it.each(['info', 'success', 'warning', 'error'] as const)('renders the %s tone', (tone) => {
    expect(render(<Notice tone={tone}>Something to know</Notice>).asFragment()).toMatchSnapshot();
  });

  it('renders a title above the message', () => {
    expect(
      render(<Notice tone="warning" title="No recovery">There is no password reset.</Notice>).asFragment()
    ).toMatchSnapshot();
  });
});
