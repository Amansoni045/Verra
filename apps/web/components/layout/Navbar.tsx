"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Sparkles, Terminal, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";
import { useUIStore } from "@/store/uiStore";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleCommandPalette, toggleShortcutsModal } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: "Studio", href: "/" },
    { label: "History", href: "/history" },
    { label: "About", href: "/about" },
    { label: "Settings", href: "/settings" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-card-border/60 bg-[#09090B]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:bg-primary/20 group-hover:border-primary/40">
            {/* Minimal SVG Sequence Wave Logo */}
            <svg
              className="w-4.5 h-4.5 text-primary transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 10s3-2 3 0 2 6 4 6 3-10 5-10 2 6 4 6 4-2 4-2" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-primary-light font-sans select-none">
            VERRA
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3.5 py-2 text-xs font-medium tracking-wide text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {isActive && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-zinc-800/40 rounded-md border border-zinc-800/20"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Shortcuts Info */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShortcutsModal}
            className="text-zinc-500 hover:text-zinc-300 p-2"
            aria-label="Keyboard shortcuts reference"
          >
            <Keyboard className="w-4.5 h-4.5" />
          </Button>

          {/* Command Palette Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCommandPalette}
            className="text-zinc-400 hover:text-white gap-2 border border-zinc-800 bg-zinc-900/30 px-3"
            aria-label="Open Command Palette"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium text-zinc-500">⌘K</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-zinc-400 hover:text-white p-2"
            aria-label="Toggle visual theme"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </Button>
          
          <Link href="/">
            <Button size="sm" className="gap-1.5 shadow-sm text-xs font-semibold px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Start Writing
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation Toggles */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme toggle mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-zinc-400 hover:text-white p-2"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-zinc-400 hover:text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-card-border/60 bg-[#09090B] overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-900/60 text-white border border-zinc-800"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-zinc-900 flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    toggleCommandPalette();
                  }}
                  className="w-full text-zinc-400 justify-start gap-2.5 text-xs h-10"
                >
                  <Terminal className="w-4 h-4" />
                  Command Palette (⌘K)
                </Button>
                <Link href="/" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2 text-xs h-10">
                    <Sparkles className="w-4 h-4" />
                    Start Writing Studio
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
