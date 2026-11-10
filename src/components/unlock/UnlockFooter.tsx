/** Privacy reassurance under the form, plus the slow-creation hint for new vaults. */
export function UnlockFooter({ hasVault }: { hasVault: boolean }) {
  return (
    <footer className="center-align supporting stack tight">
      <p>Your data is encrypted locally on this device.</p>
      <p>We never see your password or data.</p>
      {!hasVault && (
        <p className="small-text secondary-container small-padding small-round">
          ⏱️ Creating your vault takes ~30-45 seconds. Your password is being securely encrypted.
        </p>
      )}
    </footer>
  );
}
