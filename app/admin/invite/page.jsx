"use client";
import { useState } from "react";

export default function InvitePage() {
  const [email, setEmail] = useState("");

  const handleInvite = async () => {
    const res = await fetch("/api/invite", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      alert("Invite sent!");
      setEmail("");
    } else {
      alert("Error sending invite");
    }
  };

  return (
    <div>
      <h1>Invite a new user</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="User email"
      />
      <button onClick={handleInvite}>Send Invite</button>
    </div>
  );
}
