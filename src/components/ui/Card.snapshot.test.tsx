import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it.each(['filled', 'elevated', 'outlined'] as const)('renders the %s variant', (variant) => {
    expect(render(<Card variant={variant}>Cycle day 14</Card>).asFragment()).toMatchSnapshot();
  });
});
