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
// import StoresSection from "./StoresSection";
// import MallAccountSection from "./MallAccountSection";
// import StoresManager from "./StoresManager";
// import { LogOut, User, Store } from "lucide-react";

// type TabType = "stores" | "account" | "StoresManager"; // Updated type definition

// export default function MallManagerDashboard() {
//   const { user, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState<TabType>("stores");

//   const handleLogout = () => {
//     logout();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm border-b">
//         <div className="flex items-center h-16 px-4">
//           {/* Logo */}
//           <div className="flex items-center justify-start">
//             <img
//               src="/logo.png"
//               alt="eMALL Logo"
//               className="h-60 w-auto cursor-pointer -ml-10"
//             />
//           </div>

//           {/* Account Menu */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="relative h-8 w-8 rounded-full ml-auto"
//               >
//                 <Avatar className="h-8 w-8">
//                   <AvatarFallback className="bg-green-100 text-green-600">
//                     {user?.name?.charAt(0) || "U"}
//                   </AvatarFallback>
//                 </Avatar>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="w-56" align="end" forceMount>
//               <div className="flex items-center justify-start gap-2 p-2">
//                 <div className="flex flex-col space-y-1 leading-none">
//                   <p className="font-medium">
//                     {user?.name} {user?.surname}
//                   </p>
//                   <p className="w-[200px] truncate text-sm text-muted-foreground">
//                     {user?.email}
//                   </p>
//                 </div>
//               </div>
//               <DropdownMenuItem onClick={() => setActiveTab("account")}>
//                 <User className="mr-2 h-4 w-4" />
//                 <span>Account</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem onClick={handleLogout}>
//                 <LogOut className="mr-2 h-4 w-4" />
//                 <span>Sign out</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </header>

//       {/* Sidebar Navigation */}
//       <div className="flex">
//         <aside className="w-64 bg-white shadow-sm min-h-screen">
//           <nav className="mt-8 px-4">
//             <ul className="space-y-2">
//               <li>
//                 <button
//                   onClick={() => setActiveTab("stores")}
//                   className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
//                     activeTab === "stores"
//                       ? "bg-gray-200 text-gray-900"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <Store className="mr-3 h-5 w-5" />
//                   Stores
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => setActiveTab("StoresManager")} // Add button for StoresManager
//                   className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
//                     activeTab === "StoresManager"
//                       ? "bg-gray-200 text-gray-900"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <Store className="mr-3 h-5 w-5" />
//                   Stores Manager
//                 </button>
//               </li>
//               <li>
//                 <button
//                   onClick={() => setActiveTab("account")}
//                   className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
//                     activeTab === "account"
//                       ? "bg-gray-200 text-gray-900"
//                       : "text-gray-600 hover:bg-gray-100"
//                   }`}
//                 >
//                   <User className="mr-3 h-5 w-5" />
//                   Account
//                 </button>
//               </li>
//             </ul>
//           </nav>
//         </aside>

//         {/* Main Content */}
//         <main className="flex-1 p-6">
//           {activeTab === "StoresManager" && <StoresManager />}
//           {activeTab === "stores" && <StoresSection />}
//           {activeTab === "account" && <MallAccountSection />}
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StoresSection from "./StoresSection";
import MallAccountSection from "./MallAccountSection";
import StoresManager from "./StoresManager";
import { LogOut, User, Store } from "lucide-react";

type TabType = "stores" | "account" | "StoresManager";

export default function MallManagerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("stores");

  const handleLogout = () => {
    logout();
  };

  // Compute initials for Avatar
  const getInitials = () => {
    const nameInitial = user?.name?.charAt(0) || "";
    const surnameInitial = user?.surname?.charAt(0) || "";
    return `${nameInitial}${surnameInitial}`.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center h-16 px-4">
          {/* Logo */}
          <div className="flex items-center justify-start">
            <img
              src="/logo.png"
              alt="eMALL Logo"
              className="h-60 w-auto cursor-pointer -ml-10"
            />
          </div>

          {/* Account Menu */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full ml-auto"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{`${user?.name} ${user?.surname}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">
                    {user?.name} {user?.surname}
                  </p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuItem onClick={() => setActiveTab("account")}>
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab("stores")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "stores"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Store className="mr-3 h-5 w-5" />
                  Stores
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("StoresManager")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "StoresManager"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Store className="mr-3 h-5 w-5" />
                  Stores Manager
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("account")}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "account"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <User className="mr-3 h-5 w-5" />
                  Account
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "StoresManager" && <StoresManager />}
          {activeTab === "stores" && <StoresSection />}
          {activeTab === "account" && <MallAccountSection />}
        </main>
      </div>
    </div>
  );
}