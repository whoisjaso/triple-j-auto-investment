import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decompressFromEncodedURIComponent } from 'lz-string';

// ============================================================
// GET — Public endpoint for customers to fetch portal data
// No admin auth required — UUIDs are unguessable bearer tokens
//
// Data flow:
//   ?view=completed → return decoded completed_link data
//   status=pending  → return portal_data (CustomerLinkData)
//   otherwise       → 404
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = await createClient();
  const viewCompleted = req.nextUrl.searchParams.get('view') === 'completed';

  // Select only the columns we need — avoid fetching buyer_id_photo blob
  const { data, error } = await supabase
    .from('document_agreements')
    .select('id, status, portal_data, completed_link')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  const row = data as { id: string; status: string; portal_data: Record<string, unknown> | null; completed_link: string | null };

  // Completed view: decode the completed_link URL into structured data
  if (viewCompleted) {
    if (row.status !== 'completed' && row.status !== 'finalized') {
      return NextResponse.json({ error: 'Document not yet completed' }, { status: 404 });
    }
    const completedLink = row.completed_link;
    if (!completedLink) {
      return NextResponse.json({ error: 'No completed document found' }, { status: 404 });
    }
    // Extract and decode the hash fragment from the stored URL
    const hashIndex = completedLink.indexOf('#completed/');
    if (hashIndex === -1) {
      return NextResponse.json({ error: 'Invalid completed link format' }, { status: 500 });
    }
    const compressed = completedLink.slice(hashIndex + '#completed/'.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) {
      return NextResponse.json({ error: 'Failed to decode completed document' }, { status: 500 });
    }
    try {
      const completedData = JSON.parse(json);
      return NextResponse.json({ type: 'completed', data: completedData });
    } catch {
      return NextResponse.json({ error: 'Failed to parse completed document' }, { status: 500 });
    }
  }

  // Pending view: return portal_data for the customer wizard
  if (row.status !== 'pending') {
    return NextResponse.json({ error: 'Agreement is no longer pending' }, { status: 404 });
  }
  const portalData = row.portal_data;
  if (!portalData) {
    return NextResponse.json({ error: 'No portal data found' }, { status: 404 });
  }

  // Inject the agreement ID so the customer wizard can link back to this record
  portalData.aid = id;

  return NextResponse.json({ type: 'customer', data: portalData });
}
