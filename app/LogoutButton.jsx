"use client";

import { useClerk } from "@clerk/nextjs";

export default function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="mt-auto rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Log out
    </button>
  );
}
