import Link from 'next/link';

export default function Home() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://detailor.vercel.app';
  const starter = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '';
  const pro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '';
  const ent = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '';
  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-[var(--df-border)] z-40">
        <div className="container h-16 flex items-center justify-between">
          <div className="font-semibold text-[var(--df-fg)]">Detailor</div>
          <nav className="hidden md:flex items-center gap-6 text-[var(--df-body)]">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Demo</a>
            <Link className="btn-ghost" href="/signin">Sign in</Link>
            <a className="btn-primary" href={`${appUrl}/api/payments/checkout?price_id=${starter}`}>Start Free Trial</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="section">
        <div className="container grid md:grid-cols-2 items-center gap-10">
          <div className="grid gap-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--df-fg)]">Run your detailing business in one place.</h1>
            <p className="text-[var(--df-body)] text-lg">Bookings, payments, and customers—automated and effortless.</p>
            <div className="flex gap-3">
              <a className="btn-primary" href={`${appUrl}/api/payments/checkout?price_id=${starter}`}>Start Free Trial</a>
              <a className="btn-ghost" href="#demo">See Demo</a>
            </div>
          </div>
          <div className="card p-6 text-center">Device mockup</div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-[var(--df-border)] py-6">
        <div className="container text-center text-[var(--df-muted)]">Trusted by modern mobile detailers — [client logos]</div>
      </section>

      {/* Pinned Scrollytelling (placeholder static until assets wired) */}
      <section id="features" className="section">
        <div className="container grid md:grid-cols-2 gap-10 items-start">
          <div className="grid gap-5">
            <div>
              <div className="text-[var(--df-fg)] font-semibold">1. Instant online booking</div>
              <p className="text-[var(--df-body)]">Give customers a clean 6-step flow that confirms in seconds.</p>
            </div>
            <div>
              <div className="text-[var(--df-fg)] font-semibold">2. Smart pricing, zero surprises</div>
              <p className="text-[var(--df-body)]">Size and distance-based pricing with a transparent breakdown.</p>
            </div>
            <div>
              <div className="text-[var(--df-fg)] font-semibold">3. Automated confirmations & reminders</div>
              <p className="text-[var(--df-body)]">No-shows drop when clients stay informed.</p>
            </div>
            <div>
              <div className="text-[var(--df-fg)] font-semibold">4. Admin overview at a glance</div>
              <p className="text-[var(--df-body)]">Today’s jobs, revenue, and action items—front and center.</p>
            </div>
            <div>
              <div className="text-[var(--df-fg)] font-semibold">5. Get paid faster</div>
              <p className="text-[var(--df-body)]">Online or on-site. Invoices and receipts tracked automatically.</p>
            </div>
          </div>
          <div className="card p-6 text-center">Pinned device mockup (crossfades on scroll)</div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="section">
        <div className="container grid md:grid-cols-3 gap-6">
          {[
            ['Effortless Bookings','Real-time availability, no phone tag.'],
            ['Customer CRM','Vehicles, addresses, and history—organized.'],
            ['Payments & Invoices','Take payment online or mark paid on the day.'],
            ['Automation','Branded confirmations, reminders, and follow-ups.'],
            ['Reports','Revenue trends, repeat rate, top services.'],
            ['White-label (Enterprise)','Custom domain and branding.'],
          ].map(([h, s]) => (
            <div key={h} className="card p-5">
              <div className="font-semibold text-[var(--df-fg)]">{h}</div>
              <div className="text-[var(--df-body)]">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Screens Showcase placeholder */}
      <section className="section">
        <div className="container card p-6 text-center" id="demo">Screens carousel (real UI screenshots)</div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-[var(--df-fg)] mb-8">Simple pricing that scales with you</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{name:'Starter',price:'£49.99',pid:starter, blurb:'Solo operators'}, {name:'Pro',price:'£99.99',pid:pro, blurb:'Growing teams'}, {name:'Enterprise',price:'£199.99',pid:ent, blurb:'Advanced needs'}].map((t) => (
              <div key={t.name} className="card p-6 grid gap-3">
                <div className="text-xl font-semibold">{t.name}</div>
                <div className="text-3xl font-bold">{t.price}</div>
                <div className="text-[var(--df-muted)]">{t.blurb}</div>
                <a className="btn-primary text-center" href={`${appUrl}/api/payments/checkout?price_id=${t.pid}`}>Select Plan</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container grid md:grid-cols-2 gap-6">
          {[
            ['Do I need my own website?','No—your booking page is live as soon as you sign up.'],
            ['How do I get paid?','Connect Stripe in the app to accept online payments or mark paid in person.'],
            ['Can I cancel anytime?','Yes—manage your plan in the billing portal.'],
            ['Does this work on mobile?','Yes—built mobile-first for you and your customers.'],
            ['Can I import my customers?','Yes—CSV import and manual add are supported.'],
            ['Can I use my branding?','Absolutely—upload your logo and colors (or use the default theme).'],
          ].map(([q,a]) => (
            <div key={q} className="card p-5">
              <div className="font-semibold text-[var(--df-fg)]">{q}</div>
              <div className="text-[var(--df-body)]">{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-10" style={{ background: 'var(--df-primary)' }}>
        <div className="container text-center grid gap-3">
          <div className="text-white text-2xl font-bold">Start running your business on autopilot.</div>
          <div className="flex gap-3 justify-center">
            <a className="btn-primary" href={`${appUrl}/api/payments/checkout?price_id=${starter}`}>Start Free Trial</a>
            <a className="btn-ghost" href="#demo" style={{ color: 'white' }}>Book a Demo</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section">
        <div className="container grid md:grid-cols-2 gap-6 items-start">
           <div className="text-sm text-[var(--df-muted)]">Detailor is a trading name of Evans Studio Ltd.</div>
          <nav className="flex gap-4 justify-end text-sm">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Demo</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
