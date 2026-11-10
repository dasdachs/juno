import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavigationBar } from './NavigationBar';

const items = [
  { to: '/', icon: 'calendar_month', label: 'Calendar' },
  { to: '/history', icon: 'history', label: 'History' },
];

describe('NavigationBar', () => {
  it('renders a bottom bar with the current destination active', () => {
    expect(
      render(
        <MemoryRouter initialEntries={['/history']}>
          <NavigationBar variant="bar" items={items} />
        </MemoryRouter>
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders a drawer with extra content', () => {
    expect(
      render(
        <MemoryRouter>
          <NavigationBar variant="drawer" items={items}>
            <button>Lock App</button>
          </NavigationBar>
        </MemoryRouter>
      ).asFragment()
    ).toMatchSnapshot();
  });
});
