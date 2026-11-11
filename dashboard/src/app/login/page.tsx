import type { Metadata } from "next";
import { LoginScreen } from "@/components/login/login-screen";

export const metadata: Metadata = {
  title: "Sign in · Smart Vitals",
};

export default function LoginPage() {
  return <LoginScreen />;
}
