import Image from "next/image";

export default function Loading() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <span className="loading-mark" aria-hidden="true"><Image src="/recast-logo.png" alt="" width={86} height={86} priority /></span>
      <p>Connecting campaign intelligence</p>
      <span className="loading-track" aria-hidden="true"><i /></span>
    </main>
  );
}
