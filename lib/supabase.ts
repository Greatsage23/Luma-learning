import "server-only";
import { cookies } from "next/headers";

export type AppRole = "student" | "teacher" | "administrator";
export type AccountStatus = "pending_verification" | "active" | "suspended" | "disabled" | "password_change_required";
export type Profile = {id:string;full_name:string;email:string;phone:string|null;role:AppRole;status:AccountStatus;class_level:string|null;staff_id:string|null;username:string|null;last_login_at:string|null;created_at:string};

const url=()=>process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=()=>process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
export function configured(){return Boolean(url()&&anon())}
export async function supabaseFetch(path:string,init:RequestInit={},token?:string,admin=false){
  const key=admin?service():anon();if(!url()||!key)throw new Error("Supabase is not configured");
  const headers=new Headers(init.headers);headers.set("apikey",key);headers.set("Authorization",`Bearer ${token||key}`);if(!headers.has("Content-Type"))headers.set("Content-Type","application/json");
  return fetch(`${url()}${path}`,{...init,cache:"no-store",headers});
}
export async function currentSession(){
  const store=await cookies();const token=store.get("luma_access_token")?.value;if(!token)return null;
  const userRes=await supabaseFetch("/auth/v1/user",{},token);if(!userRes.ok)return null;const user=await userRes.json();
  const profileRes=await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=*`,{},token);if(!profileRes.ok)return null;const profiles=await profileRes.json() as Profile[];
  return profiles[0]?{user,profile:profiles[0],token}:null;
}
export async function requireRole(roles:AppRole[]){const session=await currentSession();if(!session)return null;if(!roles.includes(session.profile.role)||!["active","password_change_required"].includes(session.profile.status))return null;return session}
export function secureCookie(maxAge:number){return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge}}
