"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

export default function ReviewsPage() {
  const [googleUrl, setGoogleUrl] = React.useState('');
  const [bookingId, setBookingId] = React.useState('');
  const [channel, setChannel] = React.useState<'email'|'sms'>('email');
  async function saveUrl() {
    await fetch('/api/website/homepage', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ homepage_content: { google_reviews_url: googleUrl } }) });
  }
  async function sendRequest() {
    if (!bookingId) return;
    await fetch('/api/reviews/request', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ booking_id: bookingId, channel }) });
  }
  return (
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={["admin","staff"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)]">Reviews</h1>
            <div className="text-[var(--color-text-muted)]">Automate review requests and surface Google links</div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Google Reviews Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="https://g.page/r/..." value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} />
                <Button onClick={saveUrl}>Save</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Send Review Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center">
                <Input placeholder="Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
                <select className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded px-2 py-1" value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
                <Button onClick={sendRequest} disabled={!bookingId}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


