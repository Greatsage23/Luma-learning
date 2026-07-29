import { NextResponse } from "next/server";
export async function POST(){const response=NextResponse.json({ok:true});response.cookies.set("luma_access_token","",{maxAge:0,path:"/"});response.cookies.set("luma_refresh_token","",{maxAge:0,path:"/"});return response}
