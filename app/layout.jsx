// app/layout.jsx
import "./global.css";
import AppLayout from "../components/AppLayout";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "My Hope Housing Dashboard",
  description: "Housing management system",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-background text-foreground">
        {/* ClerkProvider must wrap everything that uses Clerk */}
        <ClerkProvider>
          <AppLayout>{children}</AppLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}
