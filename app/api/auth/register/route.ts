import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseFetch } from "@/lib/supabase";

const classes=["Basic 4","Basic 5","Basic 6","Basic 7","Basic 8","Basic 9"];
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern=/^[+0-9][0-9\s-]{7,18}$/;

export async function POST(request:Request){
  try{
    const {fullName,email,phone,password,confirmPassword,classLevel,acceptedTerms}=await request.json();
    const name=String(fullName||"").trim();const normalizedEmail=String(email||"").trim().toLowerCase();const normalizedPhone=String(phone||"").trim();
    if(name.length<3)return NextResponse.json({error:"Full name is required."},{status:400});
    if(!emailPattern.test(normalizedEmail))return NextResponse.json({error:"Enter a valid email address."},{status:400});
    if(!phonePattern.test(normalizedPhone))return NextResponse.json({error:"Enter a valid phone number."},{status:400});
    if(!classes.includes(classLevel))return NextResponse.json({error:"Select your class or programme."},{status:400});
    if(String(password||"").length<10||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/[0-9]/.test(password))return NextResponse.json({error:"Use at least 10 characters with uppercase, lowercase, and a number."},{status:400});
    if(password!==confirmPassword)return NextResponse.json({error:"The passwords do not match."},{status:400});
    if(acceptedTerms!==true)return NextResponse.json({error:"You must accept the Terms, Privacy Policy, and Acceptable Use Policy."},{status:400});
    const supabase=await createClient();
    const {data,error}=await supabase.auth.signUp({email:normalizedEmail,password,options:{data:{full_name:name,phone:normalizedPhone,class_level:classLevel,terms_accepted:"true",terms_version:"2026-07-30"}}});
    if(error)return NextResponse.json({error:error.message||"Unable to create the account."},{status:409});
    if(data.session&&data.user){
      await supabaseFetch(`/rest/v1/profiles?id=eq.${data.user.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"active"})},undefined,true);
      return NextResponse.json({role:"student",status:"active"},{status:201});
    }
    return NextResponse.json({role:"student",status:"pending_verification",message:"Account created. Check your email to verify your account before signing in."},{status:201});
  }catch{return NextResponse.json({error:"Unable to create the account."},{status:500})}
}
