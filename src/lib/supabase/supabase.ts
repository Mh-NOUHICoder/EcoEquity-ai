import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TreeRequest {
  name: string;
  email: string;
  reason: string;
  district: string;
  coordinates: [number, number];
}

export async function submitTreeRequest(request: TreeRequest) {
  const { data, error } = await supabase.from("tree_requests").insert([
    {
      name: request.name,
      email: request.email,
      reason: request.reason,
      district: request.district,
      lat: request.coordinates[0],
      lng: request.coordinates[1],
    },
  ]);

  if (error) throw error;
  return data;
}