import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Image from 'next/image';

type BrandSettings = {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
};

type HomepageContent = {
  hero?: { tagline?: string; description?: string; cta_text?: string; hero_image_url?: string };
  about?: { title?: string; content?: string; image_url?: string };
  services?: { featured?: string[]; show_pricing?: boolean };
  testimonials?: Array<{ name: string; content: string; rating?: number }>;
  contact?: { show_phone?: boolean; show_email?: boolean; show_address?: boolean; service_area_radius?: number };
};

async function loadTenantForSubdomain(subdomain: string) {
  const admin = getSupabaseAdmin();
  const { data: tenant } = await admin
    .from('tenants')
    .select('legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings')
    .eq('subdomain', subdomain)
    .maybeSingle();
  return tenant;
}

export default async function SitePage({ searchParams }: { searchParams?: Record<string, string> }) {
  const sub = searchParams?.subdomain || '';
  const tenant = sub ? await loadTenantForSubdomain(sub) : null;
  if (!tenant || tenant.homepage_published !== true) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="text-center text-gray-600">Site unavailable.</div>
      </main>
    );
  }
  const name = tenant.trading_name || tenant.legal_name || 'Business';
  const tpl = tenant.homepage_template || 'professional-clean';
  const brand = (tenant.brand_settings || {}) as BrandSettings;
  const content = (tenant.homepage_content || {}) as HomepageContent;
  if (tpl === 'professional-clean') return <ProfessionalClean name={name} brand={brand} content={content} />;
  if (tpl === 'service-focused') return <ServiceFocused name={name} brand={brand} content={content} />;
  return <LocalExpert name={name} brand={brand} content={content} />;
}

function ProfessionalClean({ name, brand, content }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  const primary = brand.primary_color || '#1a365d';
  return (
    <main className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="font-bold text-xl" style={{ color: primary }}>{name}</div>
        <a href="/book" className="px-4 py-2 rounded-md text-white" style={{ background: primary }}>Book Now</a>
      </header>
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{content?.hero?.tagline || 'Professional Mobile Detailing'}</h1>
          <p className="mt-4 text-gray-600">{content?.hero?.description || 'Premium car care at your location.'}</p>
          <div className="mt-6">
            <a href="/book" className="px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
          </div>
        </div>
        {content?.hero?.hero_image_url ? (
          <Image src={content.hero.hero_image_url} alt="Hero" width={600} height={400} className="rounded-xl" />
        ) : null}
      </section>
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Services</h2>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {(content?.services?.featured || []).map((s) => (
            <div key={s} className="rounded-lg border p-4">
              <div className="font-medium">{s}</div>
            </div>
          ))}
        </div>
      </section>
      <footer className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-500">
        <div>© {new Date().getFullYear()} {name}</div>
        <div className="mt-2">Powered by <a className="underline" href="https://detailflow.vercel.app">DetailFlow</a></div>
      </footer>
    </main>
  );
}

function ServiceFocused({ name, brand, content }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  const primary = brand.primary_color || '#1a365d';
  const heroUrl = content?.hero?.hero_image_url;
  return (
    <main className="min-h-screen bg-white">
      <section className="relative min-h-[60vh] flex items-center">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="relative max-w-5xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur px-4 py-2 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              {brand.logo_url ? <Image src={brand.logo_url} alt="Logo" width={32} height={32} /> : null}
            </div>
            <span className="text-gray-700 font-medium">{name}</span>
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-gray-900 drop-shadow">{content?.hero?.tagline || 'Premium Detailing, On‑Site'}</h1>
          <p className="mt-3 text-gray-700 max-w-2xl">{content?.hero?.description || 'We come to you for showroom results.'}</p>
          <a href="/book" className="mt-6 inline-block px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
        </div>
      </section>
      {Array.isArray(content?.testimonials) && content!.testimonials!.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-semibold">What customers say</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {content!.testimonials!.slice(0,3).map((t, idx) => (
              <div key={idx} className="border rounded-lg p-5">
                <div className="font-medium text-gray-900">{t.name}</div>
                <div className="mt-2 text-gray-600">{t.content}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function LocalExpert({ name, brand, content }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  const primary = brand.primary_color || '#1a365d';
  return (
    <main className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          {brand.logo_url ? <Image src={brand.logo_url} alt="Logo" width={32} height={32} /> : null}
          <div className="font-semibold text-lg" style={{ color: primary }}>{name}</div>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">{content?.hero?.tagline || 'Trusted local detailing experts'}</h1>
        <p className="mt-3 text-gray-600">{content?.hero?.description || 'Serving your community with pride and care.'}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">Fully insured</span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm">5+ years experience</span>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm">Satisfaction guaranteed</span>
        </div>
        <a href="/book" className="mt-6 inline-block px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
      </section>
    </main>
  );
}


