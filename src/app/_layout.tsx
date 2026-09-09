import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { supabase } from '@/lib/supabase';

type ProfileStatus = {
  profile_completed: boolean;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />
      <RootNavigation />
    </ThemeProvider>
  );
}

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();

  const [session, setSession] = useState<any>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  async function loadProfileStatus(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(
        'Profilstatus konnte nicht geladen werden:',
        error
      );

      setProfileCompleted(false);
      return;
    }

    setProfileCompleted(
      (data as ProfileStatus).profile_completed
    );
  }

  useEffect(() => {
    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await loadProfileStatus(session.user.id);
      } else {
        setProfileCompleted(null);
      }

      setLoading(false);
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await loadProfileStatus(session.user.id);
        } else {
          setProfileCompleted(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Wenn wir vom Onboarding zu den App-Tabs wechseln,
   * laden wir den Profilstatus erneut aus Supabase.
   *
   * Dadurch erkennt die Navigation sofort,
   * dass profile_completed inzwischen true ist.
   */
  useEffect(() => {
    if (!session?.user) {
      return;
    }

    if (segments[0] === '(app)') {
      loadProfileStatus(session.user.id);
    }
  }, [segments[0]]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';
    const inOnboarding = segments[1] === 'onboarding';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/login');
      }

      return;
    }

    if (profileCompleted === null) {
      return;
    }

    if (!profileCompleted) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }

      return;
    }

    if (profileCompleted && !inAppGroup) {
      router.replace('/(app)');
    }
  }, [
    session,
    profileCompleted,
    loading,
    segments,
  ]);

  if (loading || (session && profileCompleted === null)) {
    return <AnimatedSplashOverlay />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}