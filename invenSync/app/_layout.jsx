import { Stack, SplashScreen, router, usePathname } from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import '../global.css';
import GlobalProvider, { useGlobalContext } from '../context/GlobalProvider';

// Route guard to handle authentication redirects
const RouteGuard = ({ children }) => {
  const { isLogged, loading } = useGlobalContext();
  const pathname = usePathname(); // Use this hook instead of router.pathname

  useEffect(() => {
    if (!loading) {
      if (isLogged) {
        // If logged in and on auth pages, redirect to main app
        if (pathname === '/' || (pathname && pathname.startsWith('/(auth)'))) {
          router.replace('/(tabs)');
        }
      } else {
        // If not logged in and trying to access protected routes, redirect to landing
        if (pathname && pathname.startsWith('/(tabs)')) {
          router.replace('/');
        }
      }
    }
  }, [isLogged, loading, pathname]);

  return children;
};

// Layout with fonts
const LayoutWithFonts = () => {
  const [fontsLoaded] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

// Root layout with authentication
export default function RootLayout() {
  return (
    <GlobalProvider>
      <RouteGuard>
        <LayoutWithFonts />
      </RouteGuard>
    </GlobalProvider>
  );
}