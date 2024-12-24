"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import bcrypt from "bcryptjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nhost } from "@/lib/nhost";
import { useAccessToken, useUserData } from "@nhost/nextjs";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [number, setNumber] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const accessToken = useAccessToken();
  console.log(accessToken);
  const userData = useUserData();
  console.log(userData);
  // Password validation logic
  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!]).{8,20}$/;
    if (!regex.test(password)) {
      return "Password must be 8-20 characters long, include uppercase, lowercase, a number, and a special character.";
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const error = validatePassword(newPassword);
    setPasswordError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password before submission
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }

    try {
      // Call Nhost signup
      const result = await nhost.auth.signUp({
        email: email,
        password: password,
      });
      console.log("SignUp Response:", result);

      if (result.error) {
        // Handle errors returned by Nhost
        toast.error(result.error.message || "Signup failed.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (!result.error) {
        // Notify the user that a verification email has been sent
        toast.success(
          "Signup successful! A verification email has been sent to your inbox.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else {
        toast.warn("Signup successful, but further instructions are missing.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Error during signup:", error);
      toast.error("An error occurred. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  return (
    <>
      <ToastContainer />
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your email below to create a new account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const result = await nhost.auth.signIn({
                  provider: "google",
                  // redirectUrl:"" // Specify Google as the provider
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!!passwordError}
              >
                Sign Up
              </Button>
            </div>
          </form>

          {message && (
            <p className="mt-4 text-center text-sm text-red-600">{message}</p>
          )}

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href={`/login`} className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
