import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  try{const {email}=await request.json();const address=String(email||"").trim().toLowerCase();if(!address.includes("@"))return NextResponse.json({error:"Enter the email address registered to your account."},{status:400});const supabase=await createClient();await supabase.auth.resetPasswordForEmail(address,{redirectTo:`${new URL(request.url).origin}/reset-password`});return NextResponse.json({message:"If the account exists, a secure password-reset link has been sent."})}catch{return NextResponse.json({error:"Unable to start password recovery."},{status:500})}
}
