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

function ServiceFocused({ name }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  return (
    <main className="min-h-screen grid place-items-center p-12">
      <div className="text-gray-600">Service Focused template coming soon for this tenant. {name}</div>
    </main>
  );
}

function LocalExpert({ name }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  return (
    <main className="min-h-screen grid place-items-center p-12">
      <div className="text-gray-600">Local Expert template coming soon for this tenant. {name}</div>
    </main>
  );
}


