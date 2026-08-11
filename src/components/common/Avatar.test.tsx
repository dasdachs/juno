import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('should render the pasted image when avatarUrl is set', () => {
    render(<Avatar avatarUrl="https://example.com/photo.jpg" name="Jani Sumak" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('should fall back to initials when avatarUrl is absent', () => {
    render(<Avatar name="Jani Sumak" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to initials when the image fails to load', () => {
    render(<Avatar avatarUrl="https://example.com/broken.jpg" name="Jani Sumak" />);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('should fall back to a generic icon when neither avatarUrl nor name is set', () => {
    const { container } = render(<Avatar />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should compute a single initial for a one-word name', () => {
    render(<Avatar name="Jani" />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should compute two initials for a multi-word name', () => {
    render(<Avatar name="Jani Marie Sumak" />);

    expect(screen.getByText('JS')).toBeInTheDocument();
  });
});
