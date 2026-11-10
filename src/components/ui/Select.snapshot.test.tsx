import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Select } from './Select';

const options = (
  <>
    <option value="us">US</option>
    <option value="iso">ISO</option>
  </>
);

describe('Select', () => {
  it('renders an outlined select with a label', () => {
    expect(
      render(
        <Select id="fmt" label="Date format" value="us" onChange={() => {}}>
          {options}
        </Select>
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders the compact variant with a hidden label', () => {
    expect(
      render(
        <Select id="fmt" hideLabel label="Date format" value="iso" onChange={() => {}}>
          {options}
        </Select>
      ).asFragment()
    ).toMatchSnapshot();
  });
});
