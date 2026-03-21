import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

const SELECT_COLUMNS = 'id, name, email, phone, status, buyer_name, buyer_phone';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select(SELECT_COLUMNS)
    .neq('status', 'Lost')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[leads GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map snake_case → camelCase for frontend consumption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leads = (data ?? []).map((row: any) => ({
    id: row.id,
    name: (row.buyer_name as string) || (row.name as string),
    email: row.email ?? '',
    phone: (row.buyer_phone as string) || (row.phone as string),
    status: row.status,
  }));

  return NextResponse.json(leads);
}
