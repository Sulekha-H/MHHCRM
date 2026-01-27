// app/layout.jsx
"use client"; // Needed because we will use a client component (LogoutButton)

import "./global.css";
import { Inter } from "next/font/google";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import LogoutButton from "./LogoutButton"; // Import your logout button

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "My Hope Housing",
  description: "Housing management system",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full antialiased bg-background text-foreground`}
      >
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <div className="flex h-full">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
              <h2 className="text-xl font-bold mb-6">My Hope Housing</h2>

              {/* Sidebar navigation links */}
              <nav className="flex flex-col gap-2 mb-auto">
                <a
                  href="/dashboard"
                  className="hover:bg-gray-700 px-2 py-1 rounded"
                >
                  Dashboard
                </a>
                <a
                  href="/tasks"
                  className="hover:bg-gray-700 px-2 py-1 rounded"
                >
                  Tasks
                </a>
                {/* Add more links here */}
              </nav>

              {/* Logout button at bottom */}
              <SignedIn>
                <LogoutButton />
              </SignedIn>
            </aside>

            {/* Main content area */}
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}

