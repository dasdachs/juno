import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

const PHOTO = 'data:image/jpeg;base64,AAAA';
const BROKEN = 'data:image/jpeg;base64,BBBB';
const NEW_PHOTO = 'data:image/png;base64,CCCC';

describe('Avatar', () => {
  it('should never load a remote image URL', () => {
    render(<Avatar avatarUrl="https://example.com/photo.jpg" name="Jani Sumak" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should render the pasted image when avatarUrl is set', () => {
    render(<Avatar avatarUrl={PHOTO} name="Jani Sumak" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', PHOTO);
  });

  it('should fall back to initials when avatarUrl is absent', () => {
    render(<Avatar name="Jani Sumak" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to initials when the image fails to load', () => {
    render(<Avatar avatarUrl={BROKEN} name="Jani Sumak" />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to a generic icon when neither avatarUrl nor name is set', () => {
    const { container } = render(<Avatar />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('i')).toHaveTextContent('person');
  });

  it('should compute a single initial for a one-word name', () => {
    render(<Avatar name="Jani" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should compute two initials for a multi-word name', () => {
    render(<Avatar name="Jani Marie Sumak" />);

    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should recover when avatarUrl changes from a broken URL to a working one', () => {
    const { rerender } = render(<Avatar avatarUrl={BROKEN} name="Jani Sumak" />);

    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('JS')).toBeInTheDocument();

    rerender(<Avatar avatarUrl={NEW_PHOTO} name="Jani Sumak" />);

    expect(screen.getByRole('img')).toHaveAttribute('src', NEW_PHOTO);
  });
});

describe('Avatar data URL restrictions', () => {
  it('does not render an SVG data URL', () => {
    render(<Avatar avatarUrl="data:image/svg+xml;base64,AAAA" name="Jani Sumak" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });
});
