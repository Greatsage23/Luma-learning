import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { currentSession, requireRole } from "@/lib/supabase";

const bucket="learning-materials";
const allowedSubjects=["English Language","Mathematics","Integrated Science","Computing"];
const allowedClasses=["Basic 4","Basic 5","Basic 6","Basic 7","Basic 8","Basic 9"];
const allowedTypes=new Set(["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","image/jpeg","image/png","image/webp","video/mp4","video/webm","audio/mpeg","audio/mp4","audio/wav"]);

export async function GET(){
  const session=await currentSession();
  if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});
  const supabase=await createClient();
  const {data,error}=await supabase.from("learning_materials").select("id,teacher_id,title,description,subject,class_level,file_path,file_name,mime_type,size_bytes,status,created_at").order("created_at",{ascending:false}).limit(100);
  if(error)return NextResponse.json({error:"Unable to load learning materials."},{status:500});
  const materials=await Promise.all((data||[]).map(async material=>{
    const {data:signed}=await supabase.storage.from(bucket).createSignedUrl(material.file_path,600,{download:material.file_name});
    return {...material,downloadUrl:signed?.signedUrl||null};
  }));
  return NextResponse.json({materials,role:session.profile.role});
}

export async function POST(request:Request){
  const session=await requireRole(["teacher","administrator"]);
  if(!session)return NextResponse.json({error:"Teacher or administrator access is required."},{status:403});
  try{
    const form=await request.formData();const file=form.get("file");const title=String(form.get("title")||"").trim();const description=String(form.get("description")||"").trim();const subject=String(form.get("subject")||"");const classLevel=String(form.get("classLevel")||"");
    if(!(file instanceof File)||title.length<3||title.length>120||!allowedSubjects.includes(subject)||!allowedClasses.includes(classLevel))return NextResponse.json({error:"Complete the title, subject, class and file fields."},{status:400});
    if(!allowedTypes.has(file.type))return NextResponse.json({error:"This file type is not supported."},{status:400});
    if(file.size<=0||file.size>20*1024*1024)return NextResponse.json({error:"Files must be between 1 byte and 20 MB."},{status:400});
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-100);const path=`${session.user.id}/${crypto.randomUUID()}-${safeName}`;const supabase=await createClient();
    const {error:uploadError}=await supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError)return NextResponse.json({error:uploadError.message||"Unable to upload the file."},{status:400});
    const {data,error}=await supabase.from("learning_materials").insert({teacher_id:session.user.id,title,description:description||null,subject,class_level:classLevel,file_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size,status:"pending"}).select("id,title,status").single();
    if(error){await supabase.storage.from(bucket).remove([path]);return NextResponse.json({error:"The file uploaded, but its learning-material record could not be saved."},{status:500});}
    return NextResponse.json({material:data,message:"Material uploaded and sent for administrator review."},{status:201});
  }catch{return NextResponse.json({error:"Unable to process the learning material."},{status:500})}
}

export async function PATCH(request:Request){
  const session=await requireRole(["administrator"]);
  if(!session)return NextResponse.json({error:"Administrator access is required."},{status:403});
  try{
    const {id,status}=await request.json();
    if(!Number.isInteger(id)||!["published","rejected","archived"].includes(status))return NextResponse.json({error:"Invalid review request."},{status:400});
    const supabase=await createClient();const {error}=await supabase.from("learning_materials").update({status,reviewed_by:session.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
    if(error)return NextResponse.json({error:"Unable to update the material."},{status:500});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"Unable to review the material."},{status:500})}
}
