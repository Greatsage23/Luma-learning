import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseFetch, type Profile } from "@/lib/supabase";

export async function POST(request:Request){
  try{
    const {email,password}=await request.json();
    if(!email||!password)return NextResponse.json({error:"Email or username and password are required."},{status:400});
    let loginEmail=String(email);
    if(!loginEmail.includes("@")){
      const lookup=await supabaseFetch(`/rest/v1/profiles?username=eq.${encodeURIComponent(loginEmail)}&select=email&limit=1`,{},undefined,true);
      const rows=await lookup.json();loginEmail=rows[0]?.email||loginEmail;
    }
    const supabase=await createClient();
    const {data,error}=await supabase.auth.signInWithPassword({email:loginEmail,password});
    if(error||!data.user)return NextResponse.json({error:"Invalid login details."},{status:401});
    const {data:profile}=await supabase.from("profiles").select("*").eq("id",data.user.id).single<Profile>();
    if(!profile||["suspended","disabled"].includes(profile.status)){await supabase.auth.signOut();return NextResponse.json({error:"This account is not permitted to sign in."},{status:403});}
    await supabase.from("profiles").update({last_login_at:new Date().toISOString()}).eq("id",data.user.id);
    return NextResponse.json({role:profile.role,status:profile.status});
  }catch{return NextResponse.json({error:"Unable to sign in right now."},{status:500})}
}
