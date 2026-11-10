export interface ScrimProps {
  onClose: () => void;
  /** Accessible name of the backdrop button. */
  label?: string;
}

/** Dimmed backdrop behind a modal surface; activating it closes the surface. */
export function Scrim({ onClose, label = 'Close' }: ScrimProps) {
  return (
    <button type="button" aria-label={label} tabIndex={-1} onClick={onClose} className="scrim" />
  );
}
