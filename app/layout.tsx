import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSession } from "@/lib/session";
import AppSidebar from "@/app/components/AppSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "simplicityCurr — Currículo K-12",
  description:
    "Plataforma de currículo para Simplicity Learning Center, alineada a los estándares del DEPR.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full bg-zinc-50">
        {session.teacherId && (
          <AppSidebar
            teacherName={session.teacherName ?? null}
            role={session.role ?? null}
          />
        )}

        {/* Main content — offset by sidebar on desktop, top bar on mobile */}
        <div
          className={`flex min-h-full flex-1 flex-col ${
            session.teacherId ? "lg:pl-56" : ""
          }`}
        >
          {/* Mobile top-bar spacer */}
          {session.teacherId && <div className="h-14 lg:hidden" />}

          <div className="flex flex-1 flex-col bg-white">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
