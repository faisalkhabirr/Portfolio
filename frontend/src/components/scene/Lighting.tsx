// Phase 1: sensible, cheap lighting. No shadow maps — we want an honest
// performance baseline for the raw 79MB asset before adding any extra
// render cost. Revisit lighting design once we're past the perf baseline.
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.15} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#AEB7C2" />
    </>
  );
}
