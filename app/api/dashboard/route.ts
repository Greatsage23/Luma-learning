import { NextResponse } from "next/server";
import { requireRole,supabaseFetch } from "@/lib/supabase";

type ProfileRow={id:string;role:string;status:string;class_level:string|null};
type AssignmentRow={subjects:string[];classes:string[]};
type MaterialRow={id:number;status:string};

export async function GET(){
  const session=await requireRole(["student","teacher","administrator"]);
  if(!session)return NextResponse.json({error:"Forbidden"},{status:403});
  const [profilesResponse,materialsResponse]=await Promise.all([
    supabaseFetch("/rest/v1/profiles?select=id,role,status,class_level&deleted_at=is.null",{},undefined,true),
    supabaseFetch("/rest/v1/learning_materials?select=id,status",{},undefined,true),
  ]);
  if(!profilesResponse.ok||!materialsResponse.ok)return NextResponse.json({error:"Unable to load live dashboard data."},{status:502});
  const profiles=await profilesResponse.json() as ProfileRow[];
  const materials=await materialsResponse.json() as MaterialRow[];
  let assignments:AssignmentRow[]=[];
  if(session.profile.role==="teacher"){
    const response=await supabaseFetch(`/rest/v1/teacher_assignments?select=subjects,classes&teacher_id=eq.${session.user.id}`,{},undefined,true);
    if(response.ok)assignments=await response.json() as AssignmentRow[];
  }
  const assignedClasses=[...new Set(assignments.flatMap(value=>value.classes))];
  const visibleStudents=profiles.filter(profile=>profile.role==="student"&&(session.profile.role!=="teacher"||Boolean(profile.class_level&&assignedClasses.includes(profile.class_level))));
  const classCounts=assignedClasses.map(classLevel=>({classLevel,count:visibleStudents.filter(profile=>profile.class_level===classLevel).length}));
  return NextResponse.json({
    viewer:{fullName:session.profile.full_name,username:session.profile.username,classLevel:session.profile.class_level,role:session.profile.role},
    counts:{students:profiles.filter(profile=>profile.role==="student").length,activeStudents:profiles.filter(profile=>profile.role==="student"&&profile.status==="active").length,teachers:profiles.filter(profile=>profile.role==="teacher").length,activeTeachers:profiles.filter(profile=>profile.role==="teacher"&&profile.status==="active").length,pendingMaterials:materials.filter(material=>material.status==="pending").length,publishedMaterials:materials.filter(material=>material.status==="published").length},
    assignments:{subjects:[...new Set(assignments.flatMap(value=>value.subjects))],classes:assignedClasses},
    classCounts,
  });
}
