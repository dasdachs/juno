export interface ProgressProps {
  /** Text shown under the indicator and announced to screen readers. */
  label?: string;
  /** Fill the viewport and centre the indicator. */
  fullScreen?: boolean;
}

/** MD3 indeterminate circular progress indicator. */
export function Progress({ label = 'Loading...', fullScreen }: ProgressProps) {
  return (
    <div role="status" className={fullScreen ? 'progress-screen' : 'center-align'}>
      <progress className="circle" />
      <p>{label}</p>
    </div>
  );
}
