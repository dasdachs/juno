import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dialog } from './Dialog';
import { Button } from './Button';

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Dialog isOpen={false} onClose={() => {}} title="Delete all data?">
        body
      </Dialog>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an open modal dialog with actions', () => {
    expect(
      render(
        <Dialog isOpen onClose={() => {}} title="Delete all data?" actions={<Button variant="text">Cancel</Button>}>
          This cannot be undone.
        </Dialog>
      ).asFragment()
    ).toMatchSnapshot();
  });
});
