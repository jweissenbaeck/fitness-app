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

export default function RegisterScreen() {
  // Die Eingaben des Benutzers
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Zeigt an, ob gerade eine Registrierung läuft
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    // Prüfen, ob beide Felder ausgefüllt wurden
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte E-Mail und Passwort eingeben.');
      return;
    }

    // Supabase verlangt mindestens 6 Zeichen
    if (password.length < 6) {
      Alert.alert(
        'Passwort zu kurz',
        'Das Passwort muss mindestens 6 Zeichen lang sein.'
      );
      return;
    }

    setLoading(true);

    // Supabase erstellt den Auth-Benutzer
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    // Falls die Registrierung fehlgeschlagen ist
    if (error) {
      Alert.alert('Registrierung fehlgeschlagen', error.message);
      return;
    }

    // Wenn direkt eine Session vorhanden ist,
    // wurde der Benutzer direkt eingeloggt.
    if (data.session) {
      Alert.alert(
        'Registrierung erfolgreich',
        'Dein Konto wurde erfolgreich erstellt.'
      );
      return;
    }

    // Wenn keine Session vorhanden ist, bedeutet das bei deiner
    // aktuellen Supabase-Konfiguration normalerweise:
    // Die E-Mail muss zuerst bestätigt werden.
    Alert.alert(
      'Registrierung erfolgreich',
      'Bitte bestätige deine E-Mail-Adresse. Danach kannst du dich einloggen.'
    );

    setPassword('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Konto erstellen
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Erstelle dein Konto für die Fitness App.
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
            onPress={handleRegister}
            disabled={loading}
          >
            <ThemedText style={styles.buttonText}>
              {loading ? 'Registrieren...' : 'Registrieren'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <ThemedText style={styles.loginText}>
              Du hast bereits ein Konto? Einloggen
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
  loginButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
