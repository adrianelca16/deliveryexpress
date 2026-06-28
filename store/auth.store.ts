// stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/type';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  selectedRole: string | null;
  verificado: {
    email: boolean;
    telefono: boolean;
    cedula: boolean;
  } | null;

  login: (user: User) => void;
  logout: () => void;
  setRole: (role: string) => void;
  setVerificado: (v: { email: boolean; telefono: boolean; cedula: boolean }) => void;
  setUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      selectedRole: null,
      verificado: null,

      login: (user) =>
        set({
          isAuthenticated: true,
          user,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          verificado: null,
        }),

      setRole: (role) => set({ selectedRole: role }),
      setVerificado: (v) => set({ verificado: v }),

      setUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : state.user,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useAuth = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    verificado: state.verificado,
  }));
