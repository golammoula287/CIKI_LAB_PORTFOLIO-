import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container page-section">
      <div className="eyebrow">404 / PAGE NOT FOUND</div>
      <h1>A different direction.</h1>
      <p>This page does not exist or is no longer available.</p>
      <Link className="button primary" href="/">
        Return to the lab
      </Link>
    </main>
  );
}
