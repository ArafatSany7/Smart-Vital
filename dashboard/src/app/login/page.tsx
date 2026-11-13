import type { Metadata } from "next";
import { LoginScreen } from "@/components/login/login-screen";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "Sign in · Smart Vitals",
};

export default function LoginPage() {
  return (
    <PageTransition>
      <LoginScreen />
    </PageTransition>
  );
}
