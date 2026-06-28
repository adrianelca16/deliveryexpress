import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function Index() {
   const isRoleSelected = useAuthStore((state) => state.selectedRole);
   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
   const user = useAuthStore((state) => state.user);

   if (!isRoleSelected && !isAuthenticated) return <Redirect href="/role-select" />;

   if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;

   const role = user?.rol;
   if (role === 'comercio') return <Redirect href="/(comercio)" />;
   if (role === 'conductor') return <Redirect href="/(delivery)" />;
   return <Redirect href="/(tabs)" />;
}
