import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentSession } from "@/lib/supabase";

export async function POST(request:Request){
  const session=await currentSession();if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {password,confirmPassword}=await request.json();
  if(password!==confirmPassword||password.length<10||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return NextResponse.json({error:"Use matching passwords with 10+ characters, an uppercase letter, and a number."},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.auth.updateUser({password});
  if(error)return NextResponse.json({error:"Password could not be changed."},{status:400});
  await supabase.from("profiles").update({status:"active"}).eq("id",session.user.id);
  return NextResponse.json({ok:true});
}
