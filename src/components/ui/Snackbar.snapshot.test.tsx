import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Snackbar } from './Snackbar';

describe('Snackbar', () => {
  it('renders a polite success message', () => {
    expect(render(<Snackbar message="Mood saved" onDismiss={() => {}} />).asFragment()).toMatchSnapshot();
  });

  it('renders an assertive error message', () => {
    expect(
      render(<Snackbar message="Couldn't save" variant="error" onDismiss={() => {}} />).asFragment()
    ).toMatchSnapshot();
  });
});
