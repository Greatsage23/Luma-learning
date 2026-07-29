import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const usernamePattern=/^[a-zA-Z0-9._-]{3,30}$/;

export async function POST(request:Request){
  try{
    const {username,password}=await request.json();
    const normalized=String(username||"").trim().toLowerCase();
    if(!usernamePattern.test(normalized))return NextResponse.json({error:"Use 3–30 letters, numbers, dots, underscores, or hyphens for your username."},{status:400});
    if(String(password||"").length<10||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return NextResponse.json({error:"Use at least 10 characters, one uppercase letter, and one number."},{status:400});
    const email=`${normalized}@students.luma.invalid`;
    const supabase=await createClient();
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:normalized,username:normalized}}});
    if(error)return NextResponse.json({error:error.message||"That username is already in use."},{status:409});
    if(!data.session)return NextResponse.json({error:"Student auto-confirmation must be enabled in Supabase Auth before username-only registration can be used."},{status:409});
    return NextResponse.json({role:"student"},{status:201});
  }catch{return NextResponse.json({error:"Unable to create the account."},{status:500})}
}
