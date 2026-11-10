import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SegmentedButton } from './SegmentedButton';

describe('SegmentedButton', () => {
  it('renders segments with the selected one checked', () => {
    const segments = [
      { value: 'light', label: 'Light', icon: 'light_mode' },
      { value: 'dark', label: 'Dark', icon: 'dark_mode' },
      { value: 'auto', label: 'Auto' },
    ];
    expect(
      render(
        <SegmentedButton label="Theme" segments={segments} value="dark" onChange={() => {}} />
      ).asFragment()
    ).toMatchSnapshot();
  });
});
