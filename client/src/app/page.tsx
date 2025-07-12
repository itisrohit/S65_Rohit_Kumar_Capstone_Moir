"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/v/chat");
  }, [router]);
  return null;
}

/*
--- Original Coming Soon Page (commented out for redirect) ---

import Link from "next/link";

export default function Home() {
  // ...
  // return (
  //   <div className="min-h-screen flex flex-col items-center justify-center relative bg-black p-6 overflow-hidden">
  //     ... (coming soon UI code) ...
  //   </div>
  // );
}
*/