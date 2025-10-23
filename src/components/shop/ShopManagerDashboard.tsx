// "use client";

// import { useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import ProductsSection from "./ProductsSection";
// import PackagerSection from "./PackagerSection";
// import ProfileSection from "./ProfileSection";
// import { LogOut, User, Package, Users } from "lucide-react";

// type TabType = "products" | "packager" | "profile";

// export default function ShopManagerDashboard() {
//   const { user, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState<TabType>("products");
//   const [showAccountMenu, setShowAccountMenu] = useState(false);

//   const handleLogout = () => {
//     logout();
//   };

//   const tabs = [
//     { id: "products" as TabType, label: "Products", icon: Package },
//     { id: "packager" as TabType, label: "Packager", icon: Users },
//     { id: "profile" as TabType, label: "Profile", icon: User },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             {/* Logo */}
//             <div className="flex items-center">
//               <img
//                 src="/logo.png"
//                 alt="eMALL Logo"
//                 className="h-60 w-auto cursor-pointer -ml-16"
//               />
//             </div>

//             {/* Navigation Tabs */}
//             <div className="flex space-x-8 justify-start pl-80">
//               {tabs.map((tab) => {
//                 const Icon = tab.icon;
//                 return (
//                   <button
//                     key={tab.id}
//                     onClick={() => setActiveTab(tab.id)}
//                     className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
//                       activeTab === tab.id
//                         ? "bg-gray-200 text-gray-900"
//                         : "text-gray-500 hover:text-gray-700"
//                     }`}
//                   >
//                     <div className="flex items-center space-x-2">
//                       <Icon className="h-4 w-4" />
//                       <span>{tab.label}</span>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Account Menu */}
//             <DropdownMenu
//               open={showAccountMenu}
//               onOpenChange={setShowAccountMenu}
//             >
//               <DropdownMenuTrigger asChild>
//                 <Button
//                   variant="ghost"
//                   className="relative h-8 w-8 rounded-full"
//                 >
//                   <Avatar className="h-8 w-8">
//                     <AvatarFallback className="bg-green-100 text-green-600">
//                       {user?.name?.charAt(0) || "U"}
//                     </AvatarFallback>
//                   </Avatar>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent className="w-56" align="end" forceMount>
//                 <div className="flex items-center justify-start gap-2 p-2">
//                   <div className="flex flex-col space-y-1 leading-none">
//                     <p className="font-medium">
//                       {user?.name} {user?.surname}
//                     </p>
//                     <p className="w-[200px] truncate text-sm text-muted-foreground">
//                       {user?.email}
//                     </p>
//                   </div>
//                 </div>
//                 <DropdownMenuItem onClick={() => setActiveTab("profile")}>
//                   <User className="mr-2 h-4 w-4" />
//                   <span>Profile</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem onClick={handleLogout}>
//                   <LogOut className="mr-2 h-4 w-4" />
//                   <span>Sign out</span>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
//         {activeTab === "products" && <ProductsSection />}
//         {activeTab === "packager" && <PackagerSection />}
//         {activeTab === "profile" && <ProfileSection />}
//       </main>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Package, Users, User, Menu } from "lucide-react"; 
import PackagerSection from "./PackagerSection";
import ProfileSection from "./ProfileSection";
import ProductsSection from "./ProductsSection";

type TabType = "products" | "packager" | "profile";

export default function ShopManagerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state

  const tabs = [
    { id: "products" as TabType, label: "Products", icon: Package },
    { id: "packager" as TabType, label: "Packager", icon: Users },
    { id: "profile" as TabType, label: "Profile", icon: User },
  ];

  if (!user || !user.id) {
    return null; // Will redirect via AuthContext
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Fixed Header with Blur Effect */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Responsive sizing and no negative margin */}
            <div className="flex items-center flex-shrink-0">
              <img
                src="/logo.png"
                alt="eMALL Logo"
                className="h-8 sm:h-10 w-auto cursor-pointer" // Smaller on mobile, scales up
              />
            </div>

            {/* Mobile Menu Button (hidden on larger screens) */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-8 w-8 rounded-full"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Tabs - Hidden on mobile, full-width on desktop */}
            <div className="hidden lg:flex space-x-8 justify-start pl-0"> {/* Removed fixed pl-80 */}
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

            {/* Mobile Tabs Dropdown (shown on mobile when menu open) */}
            {isMobileMenuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-white shadow-lg border-b lg:hidden">
                <div className="flex flex-col space-y-2 p-4">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "bg-gray-200 text-gray-900"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manager Avatar with Tooltip and Border - Responsive sizing */}
            <div className="relative group flex-shrink-0">
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full" // Consistent small size
                title={`${user.name} ${user.surname}`}
              >
                <Avatar className="h-8 w-8 border-2 border-gray-300 rounded-full">
                  <AvatarFallback className="bg-green-100 text-green-600 border-2 border-gray-300 rounded-full text-xs">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
              {/* Tooltip: Hidden on mobile to avoid overlap */}
              <span className="absolute right-0 top-10 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden sm:block">
                {user.name} {user.surname}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive padding already good */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8"> {/* Reduced py on mobile */}
        {activeTab === "products" && <ProductsSection />}
        {activeTab === "packager" && <PackagerSection />}
        {activeTab === "profile" && <ProfileSection />}
      </main>
    </div>
  );
}