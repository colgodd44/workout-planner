import './globals.css';

export const metadata = {
  title: 'FitAI - Workout Planner',
  description: 'Your personal AI-powered workout planner',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
