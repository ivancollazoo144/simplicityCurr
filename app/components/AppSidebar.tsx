"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  BookMarked,
  Wrench,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

type Props = {
  teacherName: string | null;
  role: string | null;
};

const NAV = [
  { href: "/reports",    label: "Inicio",           icon: LayoutDashboard },
  { href: "/classes",    label: "Grupos",            icon: Users },
  { href: "/curriculum", label: "Currículo",         icon: GraduationCap },
  { href: "/lessons",    label: "Planificaciones",   icon: FileText },
  { href: "/workbooks",  label: "Cuadernos",         icon: BookOpen },
  { href: "/standards",  label: "Estándares DEPR",   icon: BookMarked },
  { href: "/tools",      label: "Herramientas IA",   icon: Wrench },
  { href: "/welcome",    label: "Guía de inicio",    icon: HelpCircle },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-teal/10 text-brand-teal"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon size={16} className={active ? "text-brand-teal" : "text-zinc-400"} />
      {label}
    </Link>
  );
}

export default function AppSidebar({ teacherName, role }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/reports"
      ? pathname === "/" || pathname === "/reports"
      : pathname.startsWith(href);

  const initials = teacherName
    ? teacherName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-zinc-100 px-4 py-5">
        <Link href="/reports" onClick={onNav}>
          <Image
            src="/logo.png"
            alt="Simplicity Learning Center"
            width={140}
            height={56}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon }) => (
            <li key={href}>
              <NavLink
                href={href}
                label={label}
                icon={icon}
                active={isActive(href)}
                onClick={onNav}
              />
            </li>
          ))}
        </ul>

        {role === "admin" && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Admin
            </p>
            <NavLink
              href="/admin"
              label="Administración"
              icon={Settings}
              active={pathname.startsWith("/admin")}
              onClick={onNav}
            />
          </div>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-100 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-xs font-semibold text-brand-teal">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">
              {teacherName ?? "Maestro"}
            </p>
            <p className="text-xs capitalize text-zinc-400">{role ?? "teacher"}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r border-zinc-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ──────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:hidden print:hidden">
        <Link href="/reports">
          <Image
            src="/logo.png"
            alt="Simplicity Learning Center"
            width={120}
            height={48}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100"
            >
              <X size={16} />
            </button>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
