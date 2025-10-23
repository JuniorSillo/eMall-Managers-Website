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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface UserData {
  id: number;
  name: string;
  surname: string;
  email: string;
  contacts: string;
  gender: string;
  type: string;
  username: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      console.log("Attempting login with username:", data.email);
      const response = await authAPI.login(
        data.email,
        data.password,
        "/api/Authentication/LoginManager",
      );

      console.log("API Response:", response);

      if (response.statusCode && response.token) {
        localStorage.setItem('token', response.token);

        // Fetch user details using statusCode (UserID)
        const userResponse = await authAPI.getUserById(response.statusCode);
        const userDetails = userResponse.user;

        const username = data.email;
        const userData: UserData = {
          id: response.statusCode, // UserID from statusCode
          name: userDetails.uName,
          surname: userDetails.uSurname,
          email: userDetails.uEmail,
          contacts: userDetails.uPhone,
          gender: userDetails.uGender,
          type: userDetails.uType,
          username,
        };

        if (!userData.type || !["MallManager", "ShopManager"].includes(userData.type)) {
          toast.error("Invalid user type. Must be 'MallManager' or 'ShopManager'.");
          console.error("Invalid user type:", userData.type);
          return;
        }

        console.log("Logging in user:", userData);
        login(response.token, userData);

        const isTemporaryPassword = response.message?.includes("Temporary Password Correct");

        try {
          if (isTemporaryPassword) {
            console.log("Redirecting to /change-password");
            toast.info("Please change your temporary password.");
            router.push("/change-password");
          } else if (userData.type === "MallManager") {
            console.log("Redirecting to /mall");
            toast.success("Mall Manager Login Successful!");
            router.push("/mall");
          } else if (userData.type === "ShopManager") {
            console.log("Redirecting to /shop");
            toast.success("Shop Manager Login Successful!");
            router.push("/shop");
          }
        } catch (redirectError) {
          console.error("Redirect error:", redirectError);
          toast.error("Failed to redirect. Please try again.");
        }
      } else {
        const errorMessage = response.message || "Login failed. Please check your credentials.";
        console.error("Login failed:", errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    try {
      await authAPI.forgotPassword(data.username);
      toast.info("Password reset request submitted. Check your email.");
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to submit request. Please try again.");
    }
  };

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
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="eMALL Logo"
                  className="h-40 w-auto"
                />
              </div>
            </CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={loginForm.handleSubmit(handleLogin)}
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
                    {...loginForm.register("email")}
                    aria-invalid={!!loginForm.formState.errors.email}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...loginForm.register("password")}
                    aria-invalid={!!loginForm.formState.errors.password}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-green-600 hover:text-green-700"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgotten Password?
                </Button>
              </div>
            </motion.form>
          </CardContent>
        </Card>

        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your username to receive a password reset link.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="forgot-username">Username</Label>
                <Input
                  id="forgot-username"
                  type="text"
                  placeholder="Enter your username"
                  {...forgotPasswordForm.register("username")}
                  aria-invalid={!!forgotPasswordForm.formState.errors.username}
                />
                {forgotPasswordForm.formState.errors.username?.message && (
                  <p className="text-red-500 text-xs mt-1">
                    {forgotPasswordForm.formState.errors.username.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    forgotPasswordForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotPasswordForm.formState.isSubmitting}
                >
                  {forgotPasswordForm.formState.isSubmitting
                    ? "Submitting..."
                    : "Submit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div> 
    </div>
  );
}