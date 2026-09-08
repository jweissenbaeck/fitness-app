import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

type Profile = {
  id: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
};

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login fehlgeschlagen', error.message);
      return;
    }

    setLoggedIn(true);
    await loadProfile();
  }

  async function loadProfile() {
    setProfileLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfileLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, age, height, weight')
      .eq('id', user.id)
      .single();

    setProfileLoading(false);

    if (error) {
      Alert.alert('Profil konnte nicht geladen werden', error.message);
      return;
    }

    setProfile(data);

    setName(data.name ?? '');
    setAge(data.age?.toString() ?? '');
    setHeight(data.height?.toString() ?? '');
    setWeight(data.weight?.toString() ?? '');
  }

  async function handleSaveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Fehler', 'Du bist nicht eingeloggt.');
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: name.trim() || null,
        age: age ? Number(age) : null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      })
      .eq('id', user.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      Alert.alert('Speichern fehlgeschlagen', error.message);
      return;
    }

    setProfile(data);
    setEditing(false);

    Alert.alert('Gespeichert', 'Dein Profil wurde aktualisiert.');
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setLoggedIn(false);
    setProfile(null);
    setEditing(false);

    setEmail('');
    setPassword('');
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setLoggedIn(true);
        await loadProfile();
      }
    }

    checkSession();
  }, []);

  if (loggedIn) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Mein Profil
          </ThemedText>

          {profileLoading ? (
            <ThemedText style={styles.subtitle}>
              Profil wird geladen...
            </ThemedText>
          ) : editing ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Alter"
                placeholderTextColor="#888"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Größe in cm"
                placeholderTextColor="#888"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Gewicht in kg"
                placeholderTextColor="#888"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />

              <Pressable
                style={[styles.button, saving && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <ThemedText style={styles.buttonText}>
                  {saving ? 'Speichern...' : 'Profil speichern'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setEditing(false);

                  setName(profile?.name ?? '');
                  setAge(profile?.age?.toString() ?? '');
                  setHeight(profile?.height?.toString() ?? '');
                  setWeight(profile?.weight?.toString() ?? '');
                }}
              >
                <ThemedText>Abbrechen</ThemedText>
              </Pressable>
            </View>
          ) : profile ? (
            <View style={styles.profileCard}>
              <ThemedText style={styles.profileRow}>
                Name: {profile.name || 'Noch nicht eingetragen'}
              </ThemedText>

              <ThemedText style={styles.profileRow}>
                Alter: {profile.age ?? 'Noch nicht eingetragen'}
              </ThemedText>

              <ThemedText style={styles.profileRow}>
                Größe:{' '}
                {profile.height
                  ? `${profile.height} cm`
                  : 'Noch nicht eingetragen'}
              </ThemedText>

              <ThemedText style={styles.profileRow}>
                Gewicht:{' '}
                {profile.weight
                  ? `${profile.weight} kg`
                  : 'Noch nicht eingetragen'}
              </ThemedText>

              <Pressable
                style={styles.button}
                onPress={() => setEditing(true)}
              >
                <ThemedText style={styles.buttonText}>
                  Profil bearbeiten
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <ThemedText style={styles.subtitle}>
              Kein Profil gefunden.
            </ThemedText>
          )}

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <ThemedText>Ausloggen</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Fitness App
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Melde dich an, um fortzufahren.
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="E-Mail"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? 'Einloggen...' : 'Einloggen'}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  profileRow: {
    fontSize: 17,
  },
  logoutButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});