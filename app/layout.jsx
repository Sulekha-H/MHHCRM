// app/layout.jsx
import "./global.css";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Hope Housing Dashboard",
  description: "Housing management system",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow some scaling for accessibility but keep it stable
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-background text-foreground`}>
        {/* ClerkProvider must wrap everything that uses Clerk */}
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
