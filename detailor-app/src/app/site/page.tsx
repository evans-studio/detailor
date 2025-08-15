import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Image from 'next/image';
import { PremiumProfessionalTemplate } from '@/components/website/PremiumWebsiteTemplates';

type BrandSettings = {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  font_family?: string;
};

type HomepageContent = {
  hero?: { tagline?: string; description?: string; cta_text?: string; hero_image_url?: string; video_url?: string };
  about?: { title?: string; content?: string; image_url?: string; team_photo?: string };
  services?: { 
    featured?: Array<{
      name: string;
      description: string;
      price_from?: number;
      duration?: string;
      image_url?: string;
      features?: string[];
    }>; 
    show_pricing?: boolean; 
  };
  testimonials?: Array<{ 
    name: string; 
    content: string; 
    rating?: number; 
    image_url?: string;
    location?: string;
    date?: string;
  }>;
  gallery?: {
    title?: string;
    images?: Array<{
      url: string;
      caption?: string;
      before_url?: string;
    }>;
  };
  contact?: { 
    show_phone?: boolean; 
    show_email?: boolean; 
    show_address?: boolean; 
    service_area_radius?: number;
    booking_widget?: boolean;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
};

type BusinessInfo = {
  name: string;
  legal_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  service_area?: string;
  years_experience?: number;
  certifications?: string[];
  insurance_details?: string;
};

async function loadTenantForSubdomain(subdomain: string) {
  const admin = getSupabaseAdmin();
  const { data: tenant } = await admin
    .from('tenants')
    .select('legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings, contact_email, phone, address')
    .eq('subdomain', subdomain)
    .maybeSingle();
  return tenant;
}

// type WithPromise<T> = T | Promise<T>;

export default async function SitePage({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const sp = searchParams ? await searchParams : undefined;
  const sub = sp?.subdomain || '';
  const tenant = sub ? await loadTenantForSubdomain(sub) : null;
  if (!tenant || tenant.homepage_published !== true) {
    return (
      <main className="min-h-screen grid place-items-center p-6 bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="text-center text-[var(--color-text-secondary)]">Site unavailable.</div>
      </main>
    );
  }
  const name = tenant.trading_name || tenant.legal_name || 'Business';
  const tpl = tenant.homepage_template || 'premium-professional';
  const brand = (tenant.brand_settings || {}) as BrandSettings;
  const content = (tenant.homepage_content || {}) as HomepageContent;
  
  // Enhanced business info with tenant data
  const businessInfo: BusinessInfo = {
    name,
    legal_name: tenant.legal_name,
    phone: tenant.phone,
    email: tenant.contact_email,
    address: typeof tenant.address === 'string' ? tenant.address : undefined,
    service_area: 'Greater Metropolitan Area',
    years_experience: 5,
    certifications: ['Fully Licensed', 'Insured & Bonded'],
    insurance_details: 'Comprehensive liability coverage'
  };

  // Enhanced sample content for premium template
  const enhancedContent: HomepageContent = {
    ...content,
    services: {
      ...content.services,
      featured: content.services?.featured?.length ? content.services.featured.map(service => {
        const serviceName = typeof service === 'string' ? service : service.name;
        return {
          name: serviceName,
          description: typeof service === 'string' ? `Professional ${serviceName.toLowerCase()} service` : service.description,
          price_from: typeof service !== 'string' ? service.price_from : 50,
          duration: typeof service !== 'string' ? service.duration : '2-3 hours',
          features: typeof service !== 'string' && service.features ? service.features : [
            'Professional grade products',
            'Experienced technicians',
            'Satisfaction guaranteed'
          ]
        };
      }) : [
        {
          name: 'Premium Wash & Wax',
          description: 'Complete exterior wash with protective wax coating',
          price_from: 45,
          duration: '2-3 hours',
          features: ['Hand wash', 'Clay bar treatment', 'Premium wax', 'Tire shine']
        },
        {
          name: 'Interior Deep Clean',
          description: 'Thorough interior cleaning and protection',
          price_from: 65,
          duration: '2-4 hours',
          features: ['Vacuum & shampoo', 'Leather conditioning', 'Dashboard treatment', 'Window cleaning']
        },
        {
          name: 'Full Detail Service',
          description: 'Complete interior and exterior detailing package',
          price_from: 95,
          duration: '4-6 hours',
          features: ['Everything included', 'Paint correction', 'Premium protection', 'White glove service']
        }
      ]
    },
    testimonials: content.testimonials?.length ? content.testimonials : [
      {
        name: 'Sarah Johnson',
        content: 'Absolutely incredible service! My car looks better than when I first bought it.',
        rating: 5,
        location: 'Downtown'
      },
      {
        name: 'Mike Chen',
        content: 'Professional, punctual, and perfect results. Will definitely book again.',
        rating: 5,
        location: 'Suburbs'
      },
      {
        name: 'Lisa Rodriguez',
        content: 'The attention to detail is amazing. They truly care about quality.',
        rating: 5,
        location: 'West End'
      }
    ]
  };
  
  if (tpl === 'premium-professional' || tpl === 'professional-clean') {
    return (
      <PremiumProfessionalTemplate 
        businessInfo={businessInfo} 
        brand={brand} 
        content={enhancedContent} 
      />
    );
  }
  if (tpl === 'service-focused') return <ServiceFocused name={name} brand={brand} content={content} />;
  return <LocalExpert name={name} brand={brand} content={content} />;
}

// Legacy template - keeping for backwards compatibility
// function ProfessionalClean({ name, brand, content }: { name: string; brand: BrandSettings; content: HomepageContent }) {
//   const primary = brand.primary_color || '#1a365d';
//   return (
//     <main className="min-h-screen bg-white">
//       <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
//         <div className="font-bold text-xl" style={{ color: primary }}>{name}</div>
//         <a href="/book" className="px-4 py-2 rounded-md text-white" style={{ background: primary }}>Book Now</a>
//       </header>
//       <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-center">
//         <div>
//           <h1 className="text-4xl font-bold text-gray-900">{content?.hero?.tagline || 'Professional Mobile Detailing'}</h1>
//           <p className="mt-4 text-gray-600">{content?.hero?.description || 'Premium car care at your location.'}</p>
//           <div className="mt-6">
//             <a href="/book" className="px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
//           </div>
//         </div>
//         {content?.hero?.hero_image_url ? (
//           <Image src={content.hero.hero_image_url} alt="Hero" width={600} height={400} className="rounded-xl" />
//         ) : null}
//       </section>
//       <section className="max-w-6xl mx-auto px-6 py-12">
//         <h2 className="text-2xl font-semibold text-gray-900">Services</h2>
//         <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {(content?.services?.featured || []).map((s) => (
//             <div key={s} className="rounded-lg border p-4">
//               <div className="font-medium">{s}</div>
//             </div>
//           ))}
//         </div>
//       </section>
//       <footer className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-500">
//         <div>© {new Date().getFullYear()} {name}</div>
//         <div className="mt-2">Powered by <a className="underline" href="https://detailor.co.uk">Detailor</a></div>
//       </footer>
//     </main>
//   );
// }

function ServiceFocused({ name, brand, content }: { name: string; brand: BrandSettings; content: HomepageContent }) {
  const primary = brand.primary_color || '#1a365d';
  const heroUrl = content?.hero?.hero_image_url;
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <section className="relative min-h-[60vh] flex items-center">
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="relative max-w-5xl mx-auto px-6 py-20">
          <div className="inline-flex items-center gap-3 bg-[var(--color-surface)]/80 backdrop-blur px-4 py-2 rounded-full">
            <div className="w-8 h-8 rounded-full bg-[var(--color-muted)] overflow-hidden">
              {brand.logo_url ? <Image src={brand.logo_url} alt="Logo" width={32} height={32} /> : null}
            </div>
            <span className="text-[var(--color-text)] font-medium">{name}</span>
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-[var(--color-text)] drop-shadow">{content?.hero?.tagline || 'Premium Detailing, On‑Site'}</h1>
          <p className="mt-3 text-[var(--color-text-secondary)] max-w-2xl">{content?.hero?.description || 'We come to you for showroom results.'}</p>
          <a href="/book" className="mt-6 inline-block px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
        </div>
      </section>
      {Array.isArray(content?.testimonials) && content!.testimonials!.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-semibold">What customers say</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            {content!.testimonials!.slice(0,3).map((t, idx) => (
              <div key={idx} className="border rounded-lg p-5">
                <div className="font-medium text-[var(--color-text)]">{t.name}</div>
                <div className="mt-2 text-[var(--color-text-secondary)]">{t.content}</div>
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
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <header className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          {brand.logo_url ? <Image src={brand.logo_url} alt="Logo" width={32} height={32} /> : null}
          <div className="font-semibold text-lg" style={{ color: primary }}>{name}</div>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">{content?.hero?.tagline || 'Trusted local detailing experts'}</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">{content?.hero?.description || 'Serving your community with pride and care.'}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full bg-[var(--color-success-50)] text-[var(--color-success-700)] text-sm">Fully insured</span>
          <span className="px-3 py-1 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-sm">5+ years experience</span>
          <span className="px-3 py-1 rounded-full bg-[var(--color-warning-50)] text-[var(--color-warning-700)] text-sm">Satisfaction guaranteed</span>
        </div>
        <a href="/book" className="mt-6 inline-block px-5 py-3 rounded-lg text-white" style={{ background: primary }}>{content?.hero?.cta_text || 'Book Now'}</a>
      </section>
    </main>
  );
}


