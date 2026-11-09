export default function MyWayBrand() {
  return <div className="brand">
    <span className="brand-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/myway-mark.png?v=brand-20261028" alt="" />
    </span>
    <span className="brand-copy"><strong>MyWay</strong></span>
    <small className="brand-tagline">Explore. Plan. Go Further.</small>
  </div>;
}
