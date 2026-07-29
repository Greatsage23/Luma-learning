import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "teacher" | "administrator";
export type AccountStatus = "pending_verification" | "active" | "suspended" | "disabled" | "password_change_required";
export type Profile = {id:string;full_name:string;email:string;phone:string|null;role:AppRole;status:AccountStatus;class_level:string|null;staff_id:string|null;username:string|null;last_login_at:string|null;password_changed_at:string|null;created_at:string};

const url=()=>process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable=()=>process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
export function configured(){return Boolean(url()&&publishable())}

export async function supabaseFetch(path:string,init:RequestInit={},token?:string,admin=false){
  const key=admin?service():publishable();if(!url()||!key)throw new Error("Supabase is not configured");
  const headers=new Headers(init.headers);headers.set("apikey",key);headers.set("Authorization",`Bearer ${token||key}`);if(!headers.has("Content-Type"))headers.set("Content-Type","application/json");
  return fetch(`${url()}${path}`,{...init,cache:"no-store",headers});
}

export async function currentSession(){
  const supabase=await createClient();
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user)return null;
  const [{data:{session}},{data:profile,error:profileError}]=await Promise.all([
    supabase.auth.getSession(),
    supabase.from("profiles").select("*").eq("id",user.id).single<Profile>(),
  ]);
  if(profileError||!profile||!session?.access_token)return null;
  return {user,profile,token:session.access_token};
}

export async function requireRole(roles:AppRole[]){
  const session=await currentSession();
  if(!session||!roles.includes(session.profile.role)||!["active","password_change_required"].includes(session.profile.status))return null;
  return session;
}
