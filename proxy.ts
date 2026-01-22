import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/api/webhooks/clerk(.*)",
  "/_clerk(.*)",
  "/api/clerk(.*)"
]);

// In Next.js 16, "middleware" is renamed to "proxy"
export const proxy = clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const publicRoute = isPublicRoute(req);
  console.log(`[Middleware] Path: ${pathname}, Public: ${publicRoute}`);

  if (!publicRoute) {
    // Calling await auth() explicitly before protect can sometimes resolve sync issues in Clerk v6
    const authObj = await auth();
    console.log(`[Middleware] Protecting route: ${pathname}, UserID: ${authObj.userId}`);

    // In some Clerk versions, protect is on the auth object returned by await auth()
    // In others, it might be different. Let's try both.
    if (typeof authObj.protect === 'function') {
      await authObj.protect();
    } else {
      // Fallback for different Clerk versions
      const { protect } = await auth();
      if (typeof protect === 'function') {
        await protect();
      }
    }
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
