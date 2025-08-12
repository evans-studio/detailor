export default function Head() {
  // Minimal defaults; full dynamic metadata is handled via server component in page if needed.
  return (
    <>
      <meta name="robots" content="index,follow" />
      <meta property="og:type" content="website" />
    </>
  );
}


