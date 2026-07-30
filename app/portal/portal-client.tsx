"use client";import { Dashboard,type Role } from "@/app/page";
export default function PortalClient({role}:{role:Role}){const logout=async()=>{await fetch("/api/auth/logout",{method:"POST"});location.replace("/")};return <Dashboard role={role} logout={logout}/>}
