"use client";

import { colors } from "@/lib/theme";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, UserCircle } from "lucide-react";
import { useThemeMode } from "@/context/ThemeModeContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Literary Hub", to: "/hub" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Archive", to: "/archive" },
  { label: "Our Team", to: "/team" },
  { label: "Info", to: "/info" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { mode, toggle } = useThemeMode();

  function isActive(to: string) {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  }

  return (
    <nav style={{ backgroundColor: colors.black }} className="fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group" onClick={() => setMenuOpen(false)}>
          <Image
            src="/cwc-logo.png"
            alt="CWC Logo"
            width={40}
            height={40}
            className="-mt-1"
          />
          <div className="leading-tight">
            <div style={{ fontFamily: "var(--font-display)", color: colors.white, fontWeight: 600, fontSize: "1.05rem", letterSpacing: "0.01em" }}>
              Manarat{" "}
              <span
                style={{
                  color: colors.green900,
                  backgroundColor: colors.green400,
                  padding: "0.05rem 0.4rem",
                  borderRadius: "0.3rem",
                  fontStyle: "italic",
                }}
                className="inline-block transition-transform group-hover:-translate-y-0.5"
              >
                CWC
              </span>
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              style={{
                color: isActive(link.to) ? colors.black : colors.green200,
                backgroundColor: isActive(link.to) ? colors.green400 : "transparent",
                fontSize: "0.85rem",
                fontWeight: isActive(link.to) ? 600 : 400,
                padding: "0.4rem 0.9rem",
              }}
              className="relative rounded-full transition-all hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/author"
            aria-label="Find a writer"
            title="Find a writer"
            className="p-2 rounded-full transition-all hover:opacity-80 active:scale-90"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: colors.green200 }}
          >
            <UserCircle size={16} />
          </Link>
          <button
            onClick={toggle}
            aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="p-2 rounded-full transition-all hover:opacity-80 active:scale-90"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: colors.green200 }}
          >
            {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <Link
            href="/submit"
            style={{ backgroundColor: colors.green600, color: colors.white, fontSize: "0.8rem" }}
            className="px-4 py-2 rounded-full hover:opacity-90 hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Submit Work
          </Link>
        </div>

        <button className="md:hidden text-white transition-transform active:scale-90" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div style={{ backgroundColor: colors.black }} className="md:hidden px-5 pb-5 flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              style={{
                color: isActive(link.to) ? colors.white : colors.green200,
                fontSize: "0.9rem",
                padding: "0.5rem 0",
                fontWeight: isActive(link.to) ? 600 : 400,
                borderBottom: `1px solid ${colors.green900}`,
              }}
              onClick={() => setMenuOpen(false)}
              className="transition-all hover:pl-2 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 mt-1">
            <Link
              href="/submit"
              style={{ backgroundColor: colors.green600, color: colors.white, fontSize: "0.875rem" }}
              className="px-5 py-2 rounded-full active:scale-95 transition-transform"
              onClick={() => setMenuOpen(false)}
            >
              Submit Work
            </Link>
            <Link
              href="/author"
              aria-label="Find a writer"
              title="Find a writer"
              className="p-2.5 rounded-full transition-all active:scale-90"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", color: colors.green200 }}
              onClick={() => setMenuOpen(false)}
            >
              <UserCircle size={16} />
            </Link>
            <button
              onClick={toggle}
              aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className="p-2.5 rounded-full transition-all active:scale-90"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", color: colors.green200 }}
            >
              {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
