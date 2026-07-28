import { NextResponse } from "next/server";
import { secureCookie, supabaseFetch } from "@/lib/supabase";

export async function POST(request:Request){
  try{const {email,password}=await request.json();if(!email||!password)return NextResponse.json({error:"Email or username and password are required."},{status:400});let loginEmail=email;if(!String(email).includes("@")){const lookup=await supabaseFetch(`/rest/v1/profiles?username=eq.${encodeURIComponent(email)}&select=email&limit=1`,{},undefined,true);const rows=await lookup.json();loginEmail=rows[0]?.email||email}
    const auth=await supabaseFetch("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email:loginEmail,password})});const data=await auth.json();if(!auth.ok)return NextResponse.json({error:"Invalid login details."},{status:401});
    const profileRes=await supabaseFetch(`/rest/v1/profiles?id=eq.${data.user.id}&select=*`,{},data.access_token);const [profile]=await profileRes.json();if(!profile||["suspended","disabled"].includes(profile.status))return NextResponse.json({error:"This account is not permitted to sign in."},{status:403});
    await supabaseFetch(`/rest/v1/profiles?id=eq.${data.user.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({last_login_at:new Date().toISOString()})},data.access_token);
    const response=NextResponse.json({role:profile.role,status:profile.status});response.cookies.set("luma_access_token",data.access_token,secureCookie(data.expires_in||3600));response.cookies.set("luma_refresh_token",data.refresh_token,secureCookie(60*60*24*30));return response;
  }catch{return NextResponse.json({error:"Unable to sign in right now."},{status:500})}}
