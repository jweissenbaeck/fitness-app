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

export default function LoginScreen() {
  // Die Eingaben des Benutzers
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Zeigt an, ob gerade ein Login läuft
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // Prüfen, ob beide Felder ausgefüllt wurden
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setLoading(true);

    // Supabase versucht, den Benutzer einzuloggen
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    // Falls Supabase einen Fehler zurückgibt
    if (error) {
      Alert.alert('Login fehlgeschlagen', error.message);
      return;
    }

    // Wenn der Login erfolgreich war,
    // kümmert sich das RootLayout um die Weiterleitung.
    Alert.alert('Erfolgreich', 'Du wurdest erfolgreich eingeloggt.');
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

          <Pressable
            style={styles.registerButton}
            onPress={() => router.push('/register')}
          >
            <ThemedText style={styles.registerText}>
              Noch kein Konto? Registrieren
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
  registerButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
