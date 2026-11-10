import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('renders an open sheet with handle, title and content', () => {
    expect(
      render(
        <BottomSheet isOpen onClose={() => {}} title="Log Mood">
          <p>content</p>
        </BottomSheet>
      ).asFragment()
    ).toMatchSnapshot();
  });
});
