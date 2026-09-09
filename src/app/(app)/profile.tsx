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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      .select('id, name, age, height, weight')
      .eq('id', user.id)
      .single();

    setLoading(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Deine Profildaten konnten nicht geladen werden.'
      );
      console.error(error);
      return;
    }

    setProfile(data);

    setName(data.name ?? '');
    setAge(data.age?.toString() ?? '');
    setHeight(data.height?.toString() ?? '');
    setWeight(data.weight?.toString() ?? '');
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleEdit() {
    setEditing(true);
  }

  function handleCancel() {
    if (!profile) {
      return;
    }

    setName(profile.name ?? '');
    setAge(profile.age?.toString() ?? '');
    setHeight(profile.height?.toString() ?? '');
    setWeight(profile.weight?.toString() ?? '');

    setEditing(false);
  }

  async function handleSave() {
    if (!profile) {
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
      .eq('id', profile.id)
      .select('id, name, age, height, weight')
      .single();

    setSaving(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Deine Profildaten konnten nicht gespeichert werden.'
      );
      console.error(error);
      return;
    }

    setProfile(data);
    setEditing(false);

    Alert.alert(
      'Gespeichert',
      'Deine Profildaten wurden erfolgreich gespeichert.'
    );
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        'Fehler',
        'Du konntest nicht ausgeloggt werden.'
      );
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText>
            Profildaten werden geladen...
          </ThemedText>
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
            Mein Profil
          </ThemedText>

          {editing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Alter"
                placeholderTextColor="#888"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Größe in cm"
                placeholderTextColor="#888"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
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
                onPress={handleSave}
                disabled={saving}
              >
                <ThemedText style={styles.buttonText}>
                  {saving ? 'Speichern...' : 'Speichern'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={saving}
              >
                <ThemedText style={styles.cancelText}>
                  Abbrechen
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>
                    Name
                  </ThemedText>
                  <ThemedText>
                    {profile?.name ?? 'Noch nicht angegeben'}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>
                    Alter
                  </ThemedText>
                  <ThemedText>
                    {profile?.age != null
                      ? `${profile.age} Jahre`
                      : 'Noch nicht angegeben'}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>
                    Größe
                  </ThemedText>
                  <ThemedText>
                    {profile?.height != null
                      ? `${profile.height} cm`
                      : 'Noch nicht angegeben'}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>
                    Gewicht
                  </ThemedText>
                  <ThemedText>
                    {profile?.weight != null
                      ? `${profile.weight} kg`
                      : 'Noch nicht angegeben'}
                  </ThemedText>
                </View>
              </View>

              <Pressable
                style={styles.button}
                onPress={handleEdit}
              >
                <ThemedText style={styles.buttonText}>
                  Profil bearbeiten
                </ThemedText>
              </Pressable>
            </>
          )}

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutText}>
              Ausloggen
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
    marginBottom: 32,
  },
  profileInfo: {
    width: '100%',
    marginBottom: 32,
    gap: 20,
  },
  infoRow: {
    gap: 4,
  },
  label: {
    fontWeight: '600',
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
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#888',
    marginTop: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#888',
    marginTop: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});