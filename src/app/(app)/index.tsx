import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

type Profile = {
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
};

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('name, age, height, weight')
      .eq('id', user.id)
      .single();

    setLoading(false);

    if (error) {
      console.error(
        'Profildaten konnten nicht geladen werden:',
        error
      );
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <ThemedText style={styles.loadingText}>
            Wird geladen...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Sportler';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText style={styles.eyebrow}>
                DEIN FITNESS DASHBOARD
              </ThemedText>

              <ThemedText
                type="title"
                style={styles.greeting}
              >
                Hey {firstName} 👋
              </ThemedText>

              <ThemedText style={styles.headerSubtitle}>
                Bereit, heute etwas zu erreichen?
              </ThemedText>
            </View>

            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          </View>

          {/* Training */}
          <View style={styles.workoutCard}>
            <View style={styles.workoutTop}>
              <View style={styles.workoutIcon}>
                <ThemedText style={styles.workoutIconText}>
                  ⚡
                </ThemedText>
              </View>

              <View style={styles.workoutBadge}>
                <ThemedText style={styles.workoutBadgeText}>
                  HEUTE
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.workoutTitle}>
              Dein nächstes Training
            </ThemedText>

            <ThemedText style={styles.workoutSubtitle}>
              Noch kein Training geplant
            </ThemedText>

            <Pressable style={styles.startButton}>
              <ThemedText style={styles.startButtonText}>
                Training starten
              </ThemedText>

              <ThemedText style={styles.arrow}>
                →
              </ThemedText>
            </Pressable>
          </View>

          {/* Deine Daten */}
          <View style={styles.sectionHeader}>
            <ThemedText
              type="subtitle"
              style={styles.sectionTitle}
            >
              Deine Daten
            </ThemedText>

            <ThemedText style={styles.sectionLink}>
              Profil
            </ThemedText>
          </View>

          <View style={styles.statsGrid}>

            {/* Gewicht */}
            <View style={styles.statCard}>
              <ThemedText style={styles.statIcon}>
                ⚖️
              </ThemedText>

              <View style={styles.statNumberRow}>
                <ThemedText style={styles.statValue}>
                  {profile?.weight != null
                    ? `${profile.weight}`
                    : '—'}
                </ThemedText>

                <ThemedText style={styles.statUnit}>
                  kg
                </ThemedText>
              </View>

              <ThemedText style={styles.statLabel}>
                Gewicht
              </ThemedText>
            </View>

            {/* Größe */}
            <View style={styles.statCard}>
              <ThemedText style={styles.statIcon}>
                📏
              </ThemedText>

              <View style={styles.statNumberRow}>
                <ThemedText style={styles.statValue}>
                  {profile?.height != null
                    ? `${profile.height}`
                    : '—'}
                </ThemedText>

                <ThemedText style={styles.statUnit}>
                  cm
                </ThemedText>
              </View>

              <ThemedText style={styles.statLabel}>
                Größe
              </ThemedText>
            </View>

            {/* Alter */}
            <View style={styles.statCard}>
              <ThemedText style={styles.statIcon}>
                🎂
              </ThemedText>

              <View style={styles.statNumberRow}>
                <ThemedText style={styles.statValue}>
                  {profile?.age != null
                    ? `${profile.age}`
                    : '—'}
                </ThemedText>

                <ThemedText style={styles.statUnit}>
                  Jahre
                </ThemedText>
              </View>

              <ThemedText style={styles.statLabel}>
                Alter
              </ThemedText>
            </View>

          </View>

          {/* Fortschritt */}
          <View style={styles.sectionHeader}>
            <ThemedText
              type="subtitle"
              style={styles.sectionTitle}
            >
              Dein Fortschritt
            </ThemedText>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <ThemedText style={styles.progressTitle}>
                  Diese Woche
                </ThemedText>

                <ThemedText style={styles.progressSubtitle}>
                  Starte dein erstes Training
                </ThemedText>
              </View>

              <ThemedText style={styles.progressPercentage}>
                0%
              </ThemedText>
            </View>

            <View style={styles.progressBackground}>
              <View style={styles.progressBar} />
            </View>

            <View style={styles.progressFooter}>
              <ThemedText style={styles.progressFooterText}>
                0 Trainings
              </ThemedText>

              <ThemedText style={styles.progressFooterText}>
                Ziel: 3 Trainings
              </ThemedText>
            </View>
          </View>

          {/* Motivation */}
          <View style={styles.motivationCard}>
            <ThemedText style={styles.motivationEmoji}>
              💪
            </ThemedText>

            <View style={styles.motivationContent}>
              <ThemedText style={styles.motivationTitle}>
                Jeder Anfang zählt.
              </ThemedText>

              <ThemedText style={styles.motivationText}>
                Starte heute dein erstes Training und
                beginne deinen Fortschritt zu verfolgen.
              </ThemedText>
            </View>
          </View>

        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  content: {
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#666',
    marginBottom: 6,
  },

  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: '#444',
  },

  headerSubtitle: {
    marginTop: 5,
    fontSize: 15,
    color: '#666',
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },

  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  /* Training Card */

  workoutCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 30,
    backgroundColor: '#111',
  },

  workoutTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
  },

  workoutIconText: {
    fontSize: 21,
  },

  workoutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#292929',
  },

  workoutBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  workoutTitle: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 6,
  },

  workoutSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },

  startButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
  },

  arrow: {
    color: '#111',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
  },

  /* Sections */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#444',
  },

  sectionLink: {
    fontSize: 13,
    color: '#666',
  },

  /* Stats */

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },

  statCard: {
    flex: 1,
    minHeight: 145,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },

  statIcon: {
    fontSize: 19,
    marginBottom: 14,
  },

  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  statValue: {
    color: '#111',
    fontSize: 23,
    fontWeight: '800',
  },

  statUnit: {
    color: '#666',
    fontSize: 11,
    fontWeight: '600',
  },

  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },

  /* Progress */

  progressCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressTitle: {
    color: '#111',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  progressSubtitle: {
    color: '#666',
    fontSize: 13,
  },

  progressPercentage: {
    color: '#111',
    fontSize: 24,
    fontWeight: '800',
  },

  progressBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d5d5d5',
    overflow: 'hidden',
    marginTop: 20,
  },

  progressBar: {
    width: '0%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#111',
  },

  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  progressFooterText: {
    color: '#666',
    fontSize: 12,
  },

  /* Motivation */

  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#e5e5e5',
  },

  motivationEmoji: {
    fontSize: 28,
    marginRight: 14,
  },

  motivationContent: {
    flex: 1,
  },

  motivationTitle: {
    color: '#111',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },

  motivationText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 19,
  },
});