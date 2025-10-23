// src/app/page.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPage from "@/components/auth/LoginPage";
import ShopManagerDashboard from "@/components/shop/ShopManagerDashboard";
import MallManagerDashboard from "@/components/mall/MallManagerDashboard";
import Loader from "@/components/ui/Loader";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [minLoading, setMinLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || minLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Route based on user type
  if (user.type === "ShopManager") {
    return <ShopManagerDashboard />;
  }

  if (user.type === "MallManager") {
    return <MallManagerDashboard />;
  }

  // Default fallback
  return <LoginPage />;
}
