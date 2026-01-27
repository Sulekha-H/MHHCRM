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
              <Sidebar
                collapsible="icon"
                className="border-r border-slate-200 bg-white w-64"
              >
                <SidebarHeader className="border-b border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                      <img
                        src="https://myhopehousing.org.uk/wp-content/uploads/2024/02/My-Hope-Housing-CIC.jpg"
                        alt="My Hope Housing Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">My Hope Housing</h2>
                      <p className="text-xs text-slate-500"></p>
                    </div>
                  </div>
                </SidebarHeader>

                <SidebarContent className="px-4">
                  <SidebarNavigation />
                </SidebarContent>
              </Sidebar>

              <SidebarInset className="flex-1 flex flex-col min-w-0 w-full">
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    {/* Page title will be handled by individual pages */}
                  </div>
                </header>

                <main className="flex-1 w-full min-w-0 overflow-x-auto p-6">
                  <div className="w-full h-full">
                    {children}
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

 
