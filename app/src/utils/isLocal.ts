/**
 * Check if the app is running in a local development environment
 * Used to show/hide developer-only UI elements
 */
export function isLocalEnvironment(): boolean {
  return (
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}












