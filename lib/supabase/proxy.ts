import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const mutating=["POST","PUT","PATCH","DELETE"].includes(request.method);
  const origin=request.headers.get("origin");
  if(request.nextUrl.pathname.startsWith("/api/")&&mutating&&origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Cross-site request blocked."},{status:403});
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isProtected = request.nextUrl.pathname.startsWith("/portal");
  if (isProtected && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "login");
    return NextResponse.redirect(url);
  }

  response.headers.set("X-Content-Type-Options","nosniff");
  response.headers.set("Referrer-Policy","strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy","camera=(), microphone=(self), geolocation=()");
  response.headers.set("Content-Security-Policy","frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return response;
}
