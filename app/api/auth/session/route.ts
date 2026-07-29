import { NextResponse } from "next/server";import { currentSession } from "@/lib/supabase";
export async function GET(){const session=await currentSession();return session?NextResponse.json({user:{id:session.user.id,email:session.user.email},profile:session.profile}):NextResponse.json({error:"Unauthorized"},{status:401})}
