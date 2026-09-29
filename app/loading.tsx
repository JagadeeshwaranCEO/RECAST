export default function Loading() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <span className="loading-mark">R<i /></span>
      <p>Connecting campaign intelligence</p>
      <span className="loading-track" aria-hidden="true"><i /></span>
    </main>
  );
}
