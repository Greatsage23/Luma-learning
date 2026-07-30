import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseFetch,type Profile } from "@/lib/supabase";

type LoginProfile=Profile&{failed_login_attempts:number;locked_until:string|null};
const clientIp=(request:Request)=>request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||null;

export async function POST(request:Request){
  try{
    const {email,password}=await request.json();const identifier=String(email||"").trim().toLowerCase();
    if(!identifier||!password)return NextResponse.json({error:"Email or username and password are required."},{status:400});
    let profile:LoginProfile|undefined;let loginEmail=identifier;
    const filter=identifier.includes("@")?`email=eq.${encodeURIComponent(identifier)}`:`username=eq.${encodeURIComponent(identifier)}`;
    const lookup=await supabaseFetch(`/rest/v1/profiles?${filter}&select=*&limit=1`,{},undefined,true);const rows=await lookup.json() as LoginProfile[];profile=rows[0];
    if(profile)loginEmail=profile.email;
    if(profile?.locked_until&&new Date(profile.locked_until)>new Date())return NextResponse.json({error:"Too many failed attempts. Try again later or reset your password."},{status:423});
    if(profile&&["suspended","disabled"].includes(profile.status))return NextResponse.json({error:"This account is not permitted to sign in."},{status:403});
    const supabase=await createClient();const {data,error}=await supabase.auth.signInWithPassword({email:loginEmail,password});
    const attempt={identifier,user_id:profile?.id||null,successful:!error&&Boolean(data.user),ip_address:clientIp(request),user_agent:request.headers.get("user-agent")};
    await supabaseFetch("/rest/v1/login_attempts",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(attempt)},undefined,true);
    if(error||!data.user){
      if(profile){const failures=(profile.failed_login_attempts||0)+1;const lockedUntil=failures>=5?new Date(Date.now()+15*60*1000).toISOString():null;await supabaseFetch(`/rest/v1/profiles?id=eq.${profile.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({failed_login_attempts:failures>=5?0:failures,locked_until:lockedUntil,updated_at:new Date().toISOString()})},undefined,true)}
      return NextResponse.json({error:"Invalid login details."},{status:401});
    }
    const {data:authenticatedProfile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single<LoginProfile>();
    if(!authenticatedProfile||["suspended","disabled"].includes(authenticatedProfile.status)){await supabase.auth.signOut();return NextResponse.json({error:"This account is not permitted to sign in."},{status:403})}
    const now=new Date().toISOString();const nextStatus=authenticatedProfile.status==="pending_verification"?"active":authenticatedProfile.status;
    await supabaseFetch(`/rest/v1/profiles?id=eq.${data.user.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({last_login_at:now,status:nextStatus,failed_login_attempts:0,locked_until:null,updated_at:now})},undefined,true);
    await supabaseFetch("/rest/v1/audit_logs",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({actor_id:data.user.id,action:"login_success",affected_record:data.user.id,ip_address:clientIp(request)})},undefined,true);
    return NextResponse.json({role:authenticatedProfile.role,status:nextStatus});
  }catch{return NextResponse.json({error:"Unable to sign in right now."},{status:500})}
}
