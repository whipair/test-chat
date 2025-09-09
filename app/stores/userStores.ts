// stores/userStore.ts
import { create } from 'zustand';

interface UserStore {
  currentUser: any | null;
  setCurrentUser: (user: any) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));
