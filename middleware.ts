import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/(protected)(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect(); // ✅ CORRECT
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
