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
            <div className="flex h-screen w-full overflow-hidden bg-slate-50">
              {/* Sidebar: full height, no outer scroll — nav scrolls inside if needed */}
              <aside className="flex h-full min-h-0 w-64 min-w-[16rem] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
                <Sidebar
                  collapsible="none"
                  className="flex h-full min-h-0 w-full flex-col border-0 bg-transparent"
                >
                  <SidebarHeader className="shrink-0 border-b border-slate-200 px-2 py-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="h-5 w-5 shrink-0 overflow-hidden rounded shadow-sm">
                        <img
                          src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg"
                          alt="My Hope Housing Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="truncate text-xs font-semibold text-slate-900">My Hope Housing</span>
                    </div>
                  </SidebarHeader>

                  <SidebarContent className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2">
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

 
