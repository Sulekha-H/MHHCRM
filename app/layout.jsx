// app/layout.jsx
import "./global.css";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  AlertTriangle,
  FileText,
  Building,
  Bed,
  PoundSterling,
  CheckSquare,
  Wrench,
  Gift,
  ArrowRightLeft,
  Shield,
  Heart,
  Folder,
  Settings,
  Lock,
  FileStack,
  Trash2
} from "lucide-react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SidebarNavigation from "@/components/SidebarNavigation";
import PageTitle from "@/components/PageTitle";

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
      <body className={`${inter.className} h-full antialiased bg-slate-50`}>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-slate-50">
              {/* Sidebar: fixed width, full height, never shrinks */}
              <aside className="flex h-screen w-64 min-w-[16rem] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
                <Sidebar
                  collapsible="none"
                  className="h-full w-full min-w-0 flex-col border-0 bg-transparent"
                >
                  <SidebarHeader className="flex-shrink-0 border-b border-slate-200 px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg shadow-sm">
                        <img
                          src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg"
                          alt="My Hope Housing Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-bold text-slate-900">My Hope Housing</h2>
                      </div>
                    </div>
                  </SidebarHeader>

                  <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                    <SidebarNavigation />
                  </SidebarContent>
                </Sidebar>
              </aside>

              <SidebarInset className="min-w-0 flex-1 flex flex-col bg-slate-50">
                <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-4">
                  <SidebarTrigger className="md:hidden" />
                  <PageTitle />
                </header>

                <main className="min-h-0 flex-1 overflow-auto p-6">
                  {children}
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

 
