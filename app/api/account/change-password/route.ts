import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentSession, supabaseFetch } from "@/lib/supabase";

export async function POST(request:Request){
  const session=await currentSession();if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {password,confirmPassword}=await request.json();
  if(password!==confirmPassword||password.length<10||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return NextResponse.json({error:"Use matching passwords with 10+ characters, an uppercase letter, and a number."},{status:400});
  const supabase=await createClient();
  const {error}=await supabase.auth.updateUser({password});
  if(error)return NextResponse.json({error:"Password could not be changed."},{status:400});
  const changedAt=new Date().toISOString();
  await supabaseFetch(`/rest/v1/profiles?id=eq.${session.user.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"active",password_changed_at:changedAt,updated_at:changedAt})},undefined,true);
  await supabaseFetch("/rest/v1/audit_logs",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({actor_id:session.user.id,action:"password_changed",affected_record:session.user.id,new_value:{password_changed_at:changedAt}})},undefined,true);
  return NextResponse.json({ok:true});
}
