"use client";

import { useRouter, usePathname } from "next/navigation";
import { removeJournal } from "@/lib/storage";
import { useToast } from "@/components/Toaster";

export function useDeleteJournal() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  return async function deleteJournal(shareId: string, title: string) {
    try {
      const res = await fetch(`/api/journals/${shareId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete journal");
      }
      removeJournal(shareId);
      if (pathname?.includes(shareId)) router.push("/");
      toast(`"${title}" deleted`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", true);
    }
  };
}
