import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { List, ListItem } from './List';

describe('List', () => {
  it('renders static items with icon, supporting text and trailing content', () => {
    expect(
      render(
        <List>
          <ListItem icon="schedule" headline="Session timeout" supporting="Lock after inactivity" trailing="15 min" />
          <ListItem headline="Version" />
        </List>
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders an interactive item with a toned icon badge', () => {
    expect(
      render(
        <List divided={false}>
          <ListItem icon="mood" iconTone="tone-mood" headline="Happy, Calm" onClick={() => {}} ariaLabel="Edit Happy, Calm" />
        </List>
      ).asFragment()
    ).toMatchSnapshot();
  });
});
