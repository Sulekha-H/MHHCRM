// app/layout.jsx
import "./global.css";
import AppLayout from "../components/AppLayout"; // Adjust path if AppLayout is elsewhere

export default function Rootlayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}