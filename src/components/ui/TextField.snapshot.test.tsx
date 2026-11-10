import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TextField } from './TextField';

const noop = () => {};

describe('TextField', () => {
  it('renders an outlined field with a floating label', () => {
    expect(
      render(<TextField id="name" label="Name" value="" onChange={noop} />).asFragment()
    ).toMatchSnapshot();
  });

  it('renders helper text', () => {
    expect(
      render(
        <TextField id="pw" label="Password" type="password" value="" onChange={noop} helper="At least 12 characters" />
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders the invalid state with an error message', () => {
    expect(
      render(
        <TextField id="pw" label="Password" value="x" onChange={noop} error="Passwords do not match" />
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders a multiline field', () => {
    expect(
      render(<TextField id="notes" label="Notes" multiline value="" onChange={noop} />).asFragment()
    ).toMatchSnapshot();
  });

  it('keeps the label floated for date inputs', () => {
    expect(
      render(<TextField id="d" label="Start date" type="date" value="2024-03-15" onChange={noop} />).asFragment()
    ).toMatchSnapshot();
  });
});
