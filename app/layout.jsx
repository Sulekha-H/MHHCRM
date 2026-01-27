// app/layout.jsx
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
<SidebarProvider defaultOpen={true}>
  <Sidebar collapsible="none" className="w-64">
    <SidebarContent>
      {/* Your sidebar groups, menus, etc. */}
      <SidebarFooter />
    </SidebarContent>
  </Sidebar>

  <SidebarInset>
    <div className="p-6">
      {children}
    </div>
  </SidebarInset>
</SidebarProvider>

        </ClerkProvider>
      </body>
    </html>
  );
}

