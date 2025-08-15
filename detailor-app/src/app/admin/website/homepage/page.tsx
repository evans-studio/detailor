'use client';
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

type TemplateKey = 'professional-clean' | 'service-focused' | 'local-expert';

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

type TenantHomepage = {
  id: string;
  legal_name?: string;
  trading_name?: string;
  plan_id?: string;
  feature_flags?: Record<string, unknown>;
  homepage_template: TemplateKey;
  homepage_published: boolean;
  homepage_content: HomepageContent;
  brand_settings: BrandSettings;
  subdomain?: string;
};

export default function HomepageAdminPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['homepage-settings'],
    queryFn: async (): Promise<TenantHomepage> => {
      const res = await fetch(`/api/website/homepage`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json();
      return json.data?.tenant || json.tenant;
    },
  });

  const [draft, setDraft] = React.useState<TenantHomepage | null>(null);
  React.useEffect(() => { if (data) setDraft(data); }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<TenantHomepage>) => {
      const res = await fetch(`/api/website/homepage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to save');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homepage-settings'] }),
  });

  if (isLoading || !draft) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load</div>;

  const plan = draft.plan_id || 'starter';
  const isStarter = /starter/i.test(plan);

  function set<K extends keyof TenantHomepage>(key: K, value: TenantHomepage[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } as TenantHomepage : prev);
  }

  function updateBrand<K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) {
    setDraft(prev => prev ? { ...prev, brand_settings: { ...(prev.brand_settings || {}), [key]: value } } as TenantHomepage : prev);
  }

  function updateContent(path: string[], value: unknown) {
    setDraft(prev => {
      if (!prev) return prev;
      const next = ({ ...(prev.homepage_content || {}) } as HomepageContent) as unknown as Record<string, unknown>;
      let ref: Record<string, unknown> = next;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        const current = (ref[k] as Record<string, unknown> | undefined);
        ref[k] = current && typeof current === 'object' ? current : {};
        ref = ref[k] as Record<string, unknown>;
      }
      ref[path[path.length - 1]] = value as unknown;
      return { ...prev, homepage_content: (next as unknown as HomepageContent) } as TenantHomepage;
    });
  }

  const canAdvanced = !isStarter;

  return (
    <div className="p-6 space-y-8 text-[var(--color-text)]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Homepage</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.homepage_published} onChange={e => set('homepage_published', e.target.checked)} />
            Publish
          </label>
          <button
            className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] disabled:opacity-50"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({
              homepage_template: draft.homepage_template,
              homepage_published: draft.homepage_published,
              homepage_content: draft.homepage_content,
              brand_settings: draft.brand_settings,
            })}
          >Save</button>
        </div>
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        {(['professional-clean','service-focused','local-expert'] as TemplateKey[]).map(tpl => (
          <button
            key={tpl}
            className={`border rounded-lg p-4 text-left ${draft.homepage_template === tpl ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-100)]' : 'border-[var(--color-border)]'}`}
            onClick={() => set('homepage_template', tpl)}
          >
            <div className="font-medium capitalize">{tpl.replace('-', ' ')}</div>
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">Click to select</div>
            <div className="mt-3 h-28 bg-[var(--color-muted)] rounded-md grid place-items-center text-[var(--color-text-muted)]">Preview</div>
          </button>
        ))}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold">Content</h2>
          <div className="grid gap-3">
            <label className="text-sm">Hero tagline
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.hero?.tagline || ''}
                onChange={e => updateContent(['hero','tagline'], e.target.value)} />
            </label>
            <label className="text-sm">Hero description
              <textarea className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.hero?.description || ''}
                onChange={e => updateContent(['hero','description'], e.target.value)} />
            </label>
            <label className="text-sm">CTA text
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.hero?.cta_text || ''}
                onChange={e => updateContent(['hero','cta_text'], e.target.value)} />
            </label>
            <label className="text-sm">Hero image URL
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.hero?.hero_image_url || ''}
                onChange={e => updateContent(['hero','hero_image_url'], e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 mt-6">
            <h3 className="font-medium">About</h3>
            <label className="text-sm">Title
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.about?.title || ''}
                onChange={e => updateContent(['about','title'], e.target.value)} />
            </label>
            <label className="text-sm">Content
              <textarea className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.about?.content || ''}
                onChange={e => updateContent(['about','content'], e.target.value)} />
            </label>
            <label className="text-sm">Image URL
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.homepage_content?.about?.image_url || ''}
                onChange={e => updateContent(['about','image_url'], e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 mt-6">
            <h3 className="font-medium">Services</h3>
            <label className="text-sm">Featured (comma-separated)
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={(draft.homepage_content?.services?.featured || []).join(', ')}
                onChange={e => updateContent(['services','featured'], e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </label>
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={draft.homepage_content?.services?.show_pricing ?? false}
                onChange={e => updateContent(['services','show_pricing'], e.target.checked)} />
              Show pricing
            </label>
          </div>

          <div className="grid gap-3 mt-6">
            <h3 className="font-medium">Contact</h3>
            {['show_phone','show_email','show_address'].map(key => (
              <label key={key} className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={(draft.homepage_content?.contact as Record<string, boolean> | undefined)?.[key] ?? false}
                  onChange={e => updateContent(['contact', key], e.target.checked)} />
                {key.replace('show_', '').replace('_',' ')}
              </label>
            ))}
            <label className="text-sm">Service radius (km)
              <input type="number" className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]"
                value={draft.homepage_content?.contact?.service_area_radius ?? 0}
                onChange={e => updateContent(['contact','service_area_radius'], Number(e.target.value))} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Brand</h2>
          <div className="grid gap-3">
            <label className="text-sm">Logo URL
              <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.brand_settings?.logo_url || ''}
                onChange={e => updateBrand('logo_url', e.target.value)} />
            </label>
            <form className="flex items-center gap-3" onSubmit={async e => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('file') as HTMLInputElement);
              if (!input?.files?.[0]) return;
              const fd = new FormData();
              fd.append('file', input.files[0]);
              const res = await fetch('/api/website/logo', { method: 'POST', body: fd, credentials: 'include' });
              const json = await res.json();
              if (res.ok && (json.success ?? true)) updateBrand('logo_url', json.data?.url || json.url);
            }}>
              <input type="file" name="file" accept="image/*" className="text-sm" />
              <button className="px-3 py-1.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-hover-surface)]">Upload</button>
            </form>
            <label className="text-sm">Primary color
              <input type="color" className="mt-1 h-10 w-16" value={draft.brand_settings?.primary_color || '#3B82F6'}
                onChange={e => updateBrand('primary_color', e.target.value)} />
            </label>
            {canAdvanced && (
              <>
                <label className="text-sm">Secondary color
                  <input type="color" className="mt-1 h-10 w-16" value={draft.brand_settings?.secondary_color || '#2d3748'}
                    onChange={e => updateBrand('secondary_color', e.target.value)} />
                </label>
                <label className="text-sm">Accent color
                  <input type="color" className="mt-1 h-10 w-16" value={draft.brand_settings?.accent_color || '#3182ce'}
                    onChange={e => updateBrand('accent_color', e.target.value)} />
                </label>
                <label className="text-sm">Font family
                  <input className="mt-1 w-full border border-[var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]" value={draft.brand_settings?.font_family || 'Inter'}
                    onChange={e => updateBrand('font_family', e.target.value)} />
                </label>
              </>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-semibold">Live Preview</h2>
            <iframe
              className="mt-2 w-full aspect-[16/10] border border-[var(--color-border)] rounded-lg"
              src={`/site?subdomain=${encodeURIComponent(draft.subdomain || '')}`}
            />
            {!draft.homepage_published && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">Preview only. Publish to go live.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}


