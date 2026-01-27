// app/layout.jsx
import "./global.css";
import { Sidebar, SidebarContent, SidebarFooter, SidebarProvider } from '@/components/ui/sidebar.jsx'
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

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
      <body className={`${inter.className} h-full antialiased bg-background text-foreground`}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <SidebarProvider>
            <div className="flex h-full">
              {/* Sidebar on the left */}
              <Sidebar className="w-64">
                <SidebarContent>
                  {/* Here go your sidebar groups, menus, etc. */}
                  {/* Footer at the bottom */}
                  <SidebarFooter />
                </SidebarContent>
              </Sidebar>

              {/* Main content */}
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

