"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

// Zod schema for password change
const changePasswordSchema = z.object({
  email: z.string().min(1, "Username is required"),
  currPass: z.string().min(1, "Current password is required"),
  newPass: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number, and special character",
    ),
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [showCurrPass, setShowCurrPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const { user, login, logout } = useAuth();
  const router = useRouter();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      email: user?.email || "",
      currPass: "",
      newPass: "",
    },
  });

  const handleChangePassword = async (data: ChangePasswordFormData) => {
    try {
      const response = await authAPI.changePassword(
        data.email,
        data.currPass,
        data.newPass,
      );

      if (response.statusCode === 200) {
        toast.success("Password updated successfully. Logging in...");
        // Re-authenticate with new password
        const loginResponse = await authAPI.login(
          data.email,
          data.newPass,
          "/api/Authentication/LoginManager",
        );

        if (loginResponse.statusCode === 200) {
          const userData = {
            id: user?.id || 1,
            name: user?.name || "User",
            surname: user?.surname || "Manager",
            email: data.email,
            contacts: user?.contacts || "",
            gender: user?.gender || "Other",
            type: user?.type || (data.email.startsWith("MM") ? "MallManager" : "ShopManager"),
            username: data.email,
          };
          login(loginResponse.token || "", userData);
          toast.success("Login successful!");
          // Redirect based on user type
          if (userData.type === "MallManager") {
            router.push("/mall-manager-dashboard");
          } else if (userData.type === "ShopManager") {
            router.push("/shop-manager-dashboard");
          } else {
            router.push("/store");
          }
        } else {
          toast.error("Auto-login failed. Please log in manually.");
          logout();
          router.push("/login");
        }
      } else {
        toast.error(response.message || "Failed to update password.");
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error.message || "Failed to update password.");
    }
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-md bg-white/90 shadow-xl border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={form.handleSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your username"
                    className="pl-10"
                    {...form.register("email")}
                    aria-invalid={!!form.formState.errors.email}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="currPass">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="currPass"
                    type={showCurrPass ? "text" : "password"}
                    placeholder="Enter current password"
                    className="pl-10 pr-10"
                    {...form.register("currPass")}
                    aria-invalid={!!form.formState.errors.currPass}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrPass(!showCurrPass)}
                    aria-label={showCurrPass ? "Hide password" : "Show password"}
                  >
                    {showCurrPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.currPass && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.currPass.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="newPass">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="newPass"
                    type={showNewPass ? "text" : "password"}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    {...form.register("newPass")}
                    aria-invalid={!!form.formState.errors.newPass}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPass(!showNewPass)}
                    aria-label={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {form.formState.errors.newPass && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.newPass.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}