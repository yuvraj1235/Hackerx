// src/app/api/chat/route.ts
// import { supabase } from "@/utils/superbase/server";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   const body = await req.json();
//   const { title, user_id } = body;

//   const { data, error } = await supabase
//     .from("chats")
//     .insert([{ title, user_id }])
//     .select("*")
//     .single();

//   if (error) return NextResponse.json({ error: error.message }, { status: 400 });

//   return NextResponse.json({ chat: data });
// }