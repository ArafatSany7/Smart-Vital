import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authenticate, type AuthResult } from "@/lib/auth/mock-auth";

interface SessionState {
  clinicianId: string | null;
  hydrated: boolean;
  signIn: (email: string, passcode: string) => AuthResult;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      clinicianId: null,
      hydrated: false,
      signIn: (email, passcode) => {
        const result = authenticate(email, passcode);
        if (result.ok) set({ clinicianId: result.clinician.id });
        return result;
      },
      signOut: () => set({ clinicianId: null }),
    }),
    {
      name: "smart-vitals-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ clinicianId: state.clinicianId }),
      skipHydration: true,
    },
  ),
);
