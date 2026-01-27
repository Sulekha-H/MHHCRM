// app/layout.jsx
"use client"

import "./global.css";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-background`}>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <SidebarProvider defaultOpen>
            <div className="flex min-h-screen w-full">

              <Sidebar collapsible="none" className="w-64 border-r bg-white">
                <SidebarContent>
                  {/* sidebar menus */}
                  <SidebarFooter />
                </SidebarContent>
              </Sidebar>

              <SidebarInset className="flex-1">
                <div className="p-6">
                  {children}
                </div>
              </SidebarInset>

            </div>
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

 
