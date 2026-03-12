import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  let queryResult: unknown = null;
  let queryError: unknown = null;

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make")
        .eq("status", "Available")
        .limit(2);
      queryResult = data;
      queryError = error;
    } catch (err) {
      queryError = String(err);
    }
  }

  return NextResponse.json({
    hasSupabaseUrl: !!url,
    hasAnonKey: !!key,
    urlPrefix: url.slice(0, 30),
    keyLength: key.length,
    keyLast10: key.slice(-10),
    queryResult,
    queryError,
  });
}
