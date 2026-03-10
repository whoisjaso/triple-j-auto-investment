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
            className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1.5 rounded min-h-[36px] transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting\u2026" : "Confirm"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-neutral-500 hover:text-neutral-300 px-2 py-1.5 rounded min-h-[36px] transition-colors"
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
      className="text-xs text-neutral-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded min-h-[36px]"
    >
      Delete
    </button>
  );
}
