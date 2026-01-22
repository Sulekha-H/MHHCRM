import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/_clerk(.*)",
  "/api/clerk(.*)"
]);

// In Next.js 16, "middleware" is renamed to "proxy"
export const proxy = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Calling await auth() explicitly before protect can sometimes resolve sync issues in Clerk v6
    const authObj = await auth();
    await authObj.protect();
  }
});

export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
