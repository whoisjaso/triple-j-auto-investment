"use client";

import { useState } from "react";
import type { VehicleFormState } from "@/lib/actions/vehicles";

interface DeleteButtonProps {
  id: string;
  action: (formData: FormData) => Promise<VehicleFormState>;
}

export default function DeleteButton({ id, action }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <form
          action={async (formData) => {
            setDeleting(true);
            await action(formData);
            setDeleting(false);
            setConfirming(false);
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={deleting}
            className="text-[10px] font-accent uppercase tracking-[0.1em] text-red-400/80 hover:text-red-400 bg-red-500/[0.06] border border-red-500/10 px-2.5 py-1.5 rounded-lg min-h-[36px] transition-all duration-200 disabled:opacity-40"
          >
            {deleting ? "Deleting\u2026" : "Confirm"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[10px] font-accent uppercase tracking-[0.1em] text-white/30 hover:text-white/60 px-2.5 py-1.5 rounded-lg min-h-[36px] transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[10px] font-accent uppercase tracking-[0.1em] text-white/20 hover:text-red-400/70 transition-colors px-2.5 py-1.5 rounded-lg min-h-[36px] hover:bg-red-500/[0.04]"
    >
      Delete
    </button>
  );
}
