import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

// Lightweight columns for document form dropdowns
const SELECT_COLUMNS = [
  'id', 'year', 'make', 'model', 'vin', 'trim', 'exterior_color',
  'body_style', 'mileage', 'price', 'status', 'license_plate', 'stock_number',
].join(', ');

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vehicles')
    .select(SELECT_COLUMNS)
    .order('year', { ascending: false });

  if (error) {
    console.error('[vehicles GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map snake_case → camelCase for frontend consumption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vehicles = (data ?? []).map((row: any) => ({
    id: row.id,
    year: row.year,
    make: row.make,
    model: row.model,
    vin: row.vin,
    trim: row.trim ?? '',
    exteriorColor: row.exterior_color ?? '',
    bodyStyle: row.body_style ?? '',
    mileage: row.mileage,
    price: Number(row.price),
    status: row.status,
    licensePlate: row.license_plate ?? '',
    stockNumber: row.stock_number ?? '',
  }));

  return NextResponse.json(vehicles);
}
