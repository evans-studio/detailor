import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { HomepageContent } from './page';

export async function generateMetadata({ searchParams }: { searchParams?: Record<string, string> }): Promise<Metadata> {
  const sub = searchParams?.subdomain || '';
  if (!sub) return {};
  const admin = getSupabaseAdmin();
  const { data: tenant } = await admin
    .from('tenants')
    .select('legal_name, trading_name, homepage_content')
    .eq('subdomain', sub)
    .maybeSingle();
  if (!tenant) return {};
  const titleBase = tenant.trading_name || tenant.legal_name || 'Detailing';
  const content = (tenant.homepage_content as unknown as HomepageContent) || {};
  const desc = content.hero?.description || 'Premium mobile detailing';
  return {
    title: `${titleBase} • Mobile Detailing`,
    description: desc,
    openGraph: { title: `${titleBase} • Mobile Detailing`, description: desc },
  };
}


