// app/layout.jsx
import "./global.css";
import AppLayout from "../components/AppLayout";
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* ClerkProvider must wrap everything that uses Clerk */}
        <ClerkProvider>
          <AppLayout>{children}</AppLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}
