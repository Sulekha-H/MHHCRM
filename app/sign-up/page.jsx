"use client";
import { SignUp } from "@clerk/nextjs";

export default function SetPasswordPage() {
  return <SignUp path="/set-password" routing="path" />;
}
