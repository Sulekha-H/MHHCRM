// /app/layout.jsx
export const metadata = {
  title: 'My Hope Housing',
  description: 'Dashboard app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
