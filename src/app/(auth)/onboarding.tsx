import { router } from 'expo-router';
import { useState } from 'react';
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

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !age || !height || !weight) {
      Alert.alert(
        'Fehlende Angaben',
        'Bitte fülle alle Felder aus.'
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        profile_completed: true,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Dein Profil konnte nicht gespeichert werden.'
      );
      console.error(error);
      return;
    }

    router.replace('/(app)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Erzähl uns etwas über dich
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Diese Angaben helfen uns später dabei, deine Fitnessziele
            individuell anzupassen.
          </ThemedText>

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
              {saving ? 'Speichern...' : 'Weiter'}
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
});