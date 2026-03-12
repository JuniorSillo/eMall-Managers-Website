"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Package, Users, Home, FileText, X } from "lucide-react";
import ProductsSection from "./ProductsSection";
import PackagerSection from "./PackagerSection";
import ProfileSection from "./ProfileSection";
import RetailManagerDashboardd from "./Dashboard";
import ReportsPage from "./ReportsSection";

type TabType = "dashboard" | "products" | "packager" | "reports";

export default function ShopManagerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Close panel on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Home },
    { id: "products"  as TabType, label: "Products",  icon: Package },
    { id: "packager"  as TabType, label: "Packager",  icon: Users },
    { id: "reports"   as TabType, label: "Reports",   icon: FileText },
  ];

  if (!user || !user.id) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pb-0 pb-20">

      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="eMALL Logo"
                className="h-8 md:h-60 w-auto cursor-pointer md:-ml-16"
              />
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-2 justify-start pl-80">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Avatar — opens profile panel */}
            <div className="hidden md:block relative group">
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                onClick={() => setProfileOpen((prev) => !prev)}
                title="Open profile"
              >
                <Avatar className="h-8 w-8 border-2 border-gray-300 rounded-full">
                  <AvatarFallback className="bg-green-100 text-green-600 border-2 border-gray-300 rounded-full">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
              {/* Tooltip */}
              {!profileOpen && (
                <span className="absolute right-0 top-10 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {user.name} {user.surname}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          profileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* ── Slide-over Panel ─────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          profileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-gray-200 rounded-full">
              <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm rounded-full">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                {user.name} {user.surname}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => setProfileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="Close profile"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Panel Body — reuses existing ProfileSection */}
        <div className="overflow-y-auto h-[calc(100%-65px)]">
          <ProfileSection />
        </div>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-4 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-200 text-gray-900 border-t-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}

          {/* Mobile avatar button in bottom nav */}
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-4 text-xs font-medium transition-colors ${
              profileOpen
                ? "bg-gray-200 text-gray-900 border-t-2 border-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Avatar className="h-5 w-5 mb-1 border border-gray-300 rounded-full">
              <AvatarFallback className="bg-green-100 text-green-600 text-xs rounded-full">
                {user.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && <RetailManagerDashboardd />}
        {activeTab === "products"  && <ProductsSection />}
        {activeTab === "packager"  && <PackagerSection />}
        {activeTab === "reports"   && <ReportsPage />}
      </main>
    </div>
  );
}