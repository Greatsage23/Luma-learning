import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request:Request){
  try{
    const {fullName,email,phone,password,confirmPassword,classLevel,acceptedTerms}=await request.json();
    if(!fullName||!email||!phone||!password||!classLevel)return NextResponse.json({error:"Complete all required fields."},{status:400});
    if(password!==confirmPassword)return NextResponse.json({error:"Passwords do not match."},{status:400});
    if(password.length<10||!/[A-Z]/.test(password)||!/[0-9]/.test(password))return NextResponse.json({error:"Use at least 10 characters, one uppercase letter, and one number."},{status:400});
    if(!acceptedTerms)return NextResponse.json({error:"Accept the terms and privacy policy."},{status:400});
    const supabase=await createClient();
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,phone,class_level:classLevel}}});
    if(error)return NextResponse.json({error:error.message||"An account with this email may already exist."},{status:409});
    if(!data.session)return NextResponse.json({error:"Check your email to confirm your account, then sign in."},{status:409});
    return NextResponse.json({role:"student"},{status:201});
  }catch{return NextResponse.json({error:"Unable to create the account."},{status:500})}
}
