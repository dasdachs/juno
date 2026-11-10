/** Button content while an action is running: a small spinner next to the text. */
export function BusyLabel({ children }: { children: string }) {
  return (
    <span className="busy-label">
      <progress className="circle small" aria-hidden="true" />
      {children}
    </span>
  );
}
