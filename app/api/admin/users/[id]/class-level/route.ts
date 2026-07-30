import { NextResponse } from "next/server";
import { requireRole,supabaseFetch } from "@/lib/supabase";

const allowed=["Basic 4","Basic 5","Basic 6","Basic 7","Basic 8","Basic 9"];

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const session=await requireRole(["administrator"]);
  if(!session)return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await params;const {classLevel}=await request.json();
  if(classLevel!==null&&!allowed.includes(classLevel))return NextResponse.json({error:"Select a valid class level."},{status:400});
  const existing=await supabaseFetch(`/rest/v1/profiles?select=id,role,class_level&id=eq.${id}&limit=1`,{},undefined,true);
  const rows=await existing.json() as {id:string;role:string;class_level:string|null}[];
  if(!existing.ok||rows[0]?.role!=="student")return NextResponse.json({error:"Student account not found."},{status:404});
  const updated=await supabaseFetch(`/rest/v1/profiles?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({class_level:classLevel,updated_at:new Date().toISOString()})},undefined,true);
  if(!updated.ok)return NextResponse.json({error:"Unable to update student placement."},{status:updated.status});
  await supabaseFetch("/rest/v1/audit_logs",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({actor_id:session.user.id,action:"student_class_updated",affected_record:id,previous_value:{class_level:rows[0].class_level},new_value:{class_level:classLevel}})},undefined,true);
  return NextResponse.json({classLevel});
}
