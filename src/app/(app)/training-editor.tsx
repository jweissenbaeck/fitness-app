import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
};

type WorkoutExercise = {
  localId: string;
  exerciseId: string | null;
  name: string;
  sets: number;
  reps: string;
  weight: string;
};

export default function TrainingEditorScreen() {
  const { weekday } = useLocalSearchParams<{
    weekday?: string;
  }>();

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>(
    []
  );

  const [loadingExercises, setLoadingExercises] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectingExerciseFor, setSelectingExerciseFor] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    setLoadingExercises(true);

    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment')
      .order('name');

    setLoadingExercises(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Die Übungen konnten nicht geladen werden.'
      );
      console.error(error);
      return;
    }

    setAvailableExercises(data ?? []);
  }

  function addExercise() {
    const newExercise: WorkoutExercise = {
      localId: Date.now().toString(),
      exerciseId: null,
      name: '',
      sets: 3,
      reps: '10',
      weight: '0',
    };

    setExercises((current) => [...current, newExercise]);
  }

  function selectExercise(
    localId: string,
    exercise: Exercise
  ) {
    setExercises((current) =>
      current.map((item) =>
        item.localId === localId
          ? {
              ...item,
              exerciseId: exercise.id,
              name: exercise.name,
            }
          : item
      )
    );

    setSelectingExerciseFor(null);
  }

  function updateExercise(
    localId: string,
    field: keyof WorkoutExercise,
    value: string | number
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.localId === localId
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      )
    );
  }

  function removeExercise(localId: string) {
    setExercises((current) =>
      current.filter((exercise) => exercise.localId !== localId)
    );

    if (selectingExerciseFor === localId) {
      setSelectingExerciseFor(null);
    }
  }

  async function saveWorkout() {
    if (!name.trim()) {
      Alert.alert(
        'Fehlender Name',
        'Bitte gib deinem Training einen Namen.'
      );
      return;
    }

    if (exercises.length === 0) {
      Alert.alert(
        'Keine Übungen',
        'Bitte füge mindestens eine Übung hinzu.'
      );
      return;
    }

    const hasUnselectedExercise = exercises.some(
      (exercise) => !exercise.exerciseId
    );

    if (hasUnselectedExercise) {
      Alert.alert(
        'Übung fehlt',
        'Bitte wähle für jede Übung eine Übung aus.'
      );
      return;
    }

    const hasInvalidSets = exercises.some(
      (exercise) => exercise.sets < 1
    );

    if (hasInvalidSets) {
      Alert.alert(
        'Ungültige Sätze',
        'Jede Übung muss mindestens einen Satz haben.'
      );
      return;
    }

    const hasInvalidReps = exercises.some(
      (exercise) =>
        !exercise.reps ||
        Number(exercise.reps) < 1
    );

    if (hasInvalidReps) {
      Alert.alert(
        'Ungültige Wiederholungen',
        'Bitte gib für jede Übung mindestens eine Wiederholung an.'
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert(
        'Fehler',
        'Du bist nicht eingeloggt.'
      );
      return;
    }

    setSaving(true);

    // 1. Trainingsvorlage erstellen
    const { data: template, error: templateError } =
      await supabase
        .from('workout_templates')
        .insert({
          user_id: user.id,
          name: name.trim(),
        })
        .select()
        .single();

    if (templateError || !template) {
      setSaving(false);

      Alert.alert(
        'Fehler',
        'Das Training konnte nicht erstellt werden.'
      );

      console.error(templateError);
      return;
    }

    // 2. Übungen und Sätze speichern
    for (
      let exerciseIndex = 0;
      exerciseIndex < exercises.length;
      exerciseIndex++
    ) {
      const exercise = exercises[exerciseIndex];

      const { data: templateExercise, error: exerciseError } =
        await supabase
          .from('template_exercises')
          .insert({
            template_id: template.id,
            exercise_id: exercise.exerciseId,
            position: exerciseIndex + 1,
          })
          .select()
          .single();

      if (exerciseError || !templateExercise) {
        setSaving(false);

        Alert.alert(
          'Fehler',
          'Eine Übung konnte nicht gespeichert werden.'
        );

        console.error(exerciseError);
        return;
      }

      const numberOfSets = Number(exercise.sets);

      const sets = Array.from(
        { length: numberOfSets },
        (_, index) => ({
          template_exercise_id: templateExercise.id,
          set_number: index + 1,
          target_reps: Number(exercise.reps),
          target_weight: Number(exercise.weight) || 0,
        })
      );

      const { error: setsError } = await supabase
        .from('template_sets')
        .insert(sets);

      if (setsError) {
        setSaving(false);

        Alert.alert(
          'Fehler',
          'Die Sätze konnten nicht gespeichert werden.'
        );

        console.error(setsError);
        return;
      }
    }

    // 3. Neues Training dem ausgewählten Wochentag zuweisen
    if (weekday) {
      const weekdayNumber = Number(weekday);

      if (
        Number.isInteger(weekdayNumber) &&
        weekdayNumber >= 1 &&
        weekdayNumber <= 7
      ) {
        const { error: rotationError } = await supabase
          .from('weekly_rotation')
          .upsert(
            {
              user_id: user.id,
              weekday: weekdayNumber,
              activity_type: 'gym',
              template_id: template.id,
              custom_activity_id: null,
            },
            {
              onConflict: 'user_id,weekday',
            }
          );

        if (rotationError) {
          setSaving(false);

          Alert.alert(
            'Training erstellt',
            'Das Training wurde erstellt, konnte aber nicht dem Wochentag zugewiesen werden.'
          );

          console.error(rotationError);
          return;
        }
      }
    }

    setSaving(false);

    Alert.alert(
      'Training erstellt',
      weekday
        ? 'Deine Trainingsvorlage wurde erstellt und dem Wochentag zugewiesen.'
        : 'Deine Trainingsvorlage wurde erfolgreich gespeichert.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backArrow}>
              ‹
            </ThemedText>

            <ThemedText style={styles.backText}>
              Zurück
            </ThemedText>
          </Pressable>

          <ThemedText
            type="title"
            style={styles.title}
          >
            Neues Training
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Stelle dein Training zusammen und definiere deine Zielwerte.
          </ThemedText>

          <View style={styles.section}>
            <ThemedText
              type="subtitle"
              style={styles.sectionTitle}
            >
              Trainingsname
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="z. B. Oberkörper"
              placeholderTextColor="#777"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ThemedText
                type="subtitle"
                style={styles.sectionTitle}
              >
                Übungen
              </ThemedText>

              <View style={styles.exerciseCountBadge}>
                <ThemedText style={styles.exerciseCount}>
                  {exercises.length}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionDescription}>
              Lege fest, welche Übungen und Zielwerte du trainieren möchtest.
            </ThemedText>
          </View>

          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <ThemedText style={styles.emptyIconText}>
                  +
                </ThemedText>
              </View>

              <ThemedText style={styles.emptyTitle}>
                Noch keine Übungen
              </ThemedText>

              <ThemedText style={styles.emptyText}>
                Füge deine erste Übung hinzu, um dein Training aufzubauen.
              </ThemedText>
            </View>
          ) : (
            exercises.map((exercise, index) => (
              <View
                key={exercise.localId}
                style={styles.exerciseCard}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumberContainer}>
                    <View style={styles.numberBadge}>
                      <ThemedText style={styles.numberText}>
                        {index + 1}
                      </ThemedText>
                    </View>

                    <ThemedText style={styles.exerciseNumber}>
                      Übung {index + 1}
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() =>
                      removeExercise(exercise.localId)
                    }
                  >
                    <ThemedText style={styles.removeText}>
                      Entfernen
                    </ThemedText>
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    styles.exerciseSelector,
                    !exercise.exerciseId &&
                      styles.exerciseSelectorEmpty,
                  ]}
                  onPress={() =>
                    setSelectingExerciseFor(
                      selectingExerciseFor === exercise.localId
                        ? null
                        : exercise.localId
                    )
                  }
                >
                  <View style={styles.exerciseSelectorContent}>
                    <View style={styles.exerciseSelectorMain}>
                      <ThemedText
                        style={[
                          styles.exerciseSelectorText,
                          !exercise.exerciseId &&
                            styles.placeholderText,
                        ]}
                      >
                        {exercise.name || 'Übung auswählen'}
                      </ThemedText>

                      {!exercise.exerciseId && (
                        <ThemedText style={styles.selectorHint}>
                          Aus deiner Übungsbibliothek auswählen
                        </ThemedText>
                      )}
                    </View>

                    {exercise.exerciseId && (
                      <ThemedText style={styles.changeText}>
                        Ändern
                      </ThemedText>
                    )}
                  </View>
                </Pressable>

                {selectingExerciseFor === exercise.localId && (
                  <View style={styles.exerciseSelection}>
                    <ThemedText style={styles.selectionTitle}>
                      Übung auswählen
                    </ThemedText>

                    {loadingExercises ? (
                      <ThemedText style={styles.loading}>
                        Übungen werden geladen...
                      </ThemedText>
                    ) : availableExercises.length === 0 ? (
                      <ThemedText style={styles.emptyText}>
                        Es sind noch keine Übungen in deiner
                        Übungsbibliothek vorhanden.
                      </ThemedText>
                    ) : (
                      availableExercises.map((availableExercise) => (
                        <Pressable
                          key={availableExercise.id}
                          style={styles.exerciseOption}
                          onPress={() =>
                            selectExercise(
                              exercise.localId,
                              availableExercise
                            )
                          }
                        >
                          <View style={styles.exerciseOptionIcon}>
                            <ThemedText
                              style={styles.exerciseOptionIconText}
                            >
                              {availableExercise.name
                                .charAt(0)
                                .toUpperCase()}
                            </ThemedText>
                          </View>

                          <View style={styles.exerciseOptionContent}>
                            <ThemedText
                              style={styles.exerciseOptionName}
                            >
                              {availableExercise.name}
                            </ThemedText>

                            {(
                              availableExercise.muscle_group ||
                              availableExercise.equipment
                            ) && (
                              <ThemedText
                                style={styles.exerciseOptionDetails}
                              >
                                {[
                                  availableExercise.muscle_group,
                                  availableExercise.equipment,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </ThemedText>
                            )}
                          </View>

                          <ThemedText style={styles.exerciseOptionArrow}>
                            ›
                          </ThemedText>
                        </Pressable>
                      ))
                    )}
                  </View>
                )}

                <View style={styles.targetSection}>
                  <ThemedText style={styles.targetTitle}>
                    Zielwerte
                  </ThemedText>

                  <View style={styles.row}>
                    <View style={styles.smallField}>
                      <ThemedText style={styles.fieldLabel}>
                        Sätze
                      </ThemedText>

                      <TextInput
                        style={styles.compactInput}
                        value={String(exercise.sets)}
                        onChangeText={(value) =>
                          updateExercise(
                            exercise.localId,
                            'sets',
                            Number(value) || 0
                          )
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.smallField}>
                      <ThemedText style={styles.fieldLabel}>
                        Wiederholungen
                      </ThemedText>

                      <TextInput
                        style={styles.compactInput}
                        value={exercise.reps}
                        onChangeText={(value) =>
                          updateExercise(
                            exercise.localId,
                            'reps',
                            value
                          )
                        }
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.smallField}>
                      <ThemedText style={styles.fieldLabel}>
                        Gewicht
                      </ThemedText>

                      <TextInput
                        style={styles.compactInput}
                        value={exercise.weight}
                        onChangeText={(value) =>
                          updateExercise(
                            exercise.localId,
                            'weight',
                            value
                          )
                        }
                        keyboardType="decimal-pad"
                        placeholder="kg"
                        placeholderTextColor="#777"
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          <Pressable
            style={styles.addButton}
            onPress={addExercise}
          >
            <View style={styles.addIcon}>
              <ThemedText style={styles.addIconText}>
                +
              </ThemedText>
            </View>

            <ThemedText style={styles.addButtonText}>
              Übung hinzufügen
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.buttonDisabled,
            ]}
            onPress={saveWorkout}
            disabled={saving}
          >
            <ThemedText style={styles.saveButtonText}>
              {saving
                ? 'Training wird gespeichert...'
                : 'Training speichern'}
            </ThemedText>
          </Pressable>
        </ScrollView>
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

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 44,
    marginBottom: 12,
  },

  backArrow: {
    fontSize: 26,
    color: '#222',
    marginRight: 6,
  },

  backText: {
    color: '#333',
  },

  title: {
    marginBottom: 8,
    color: '#222',
  },

  subtitle: {
    marginBottom: 28,
    color: '#555',
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  sectionTitle: {
    color: '#222',
  },

  exerciseCountBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  exerciseCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },

  sectionDescription: {
    color: '#555',
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#FFFFFF',
  },

  exerciseCard: {
    borderWidth: 1,
    borderColor: '#E3E3E3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },

  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  exerciseNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  numberBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  numberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },

  exerciseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  removeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },

  exerciseSelector: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },

  exerciseSelectorEmpty: {
    borderStyle: 'dashed',
  },

  exerciseSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  exerciseSelectorMain: {
    flex: 1,
  },

  exerciseSelectorText: {
    fontSize: 16,
    color: '#222',
  },

  placeholderText: {
    color: '#555',
  },

  selectorHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
  },

  changeText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
  },

  exerciseSelection: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },

  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222',
  },

  exerciseOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  exerciseOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },

  exerciseOptionIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },

  exerciseOptionContent: {
    flex: 1,
  },

  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  exerciseOptionDetails: {
    marginTop: 3,
    fontSize: 13,
    color: '#666',
  },

  exerciseOptionArrow: {
    fontSize: 23,
    color: '#555',
    marginLeft: 8,
  },

  targetSection: {
    marginTop: 2,
  },

  targetTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  smallField: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    color: '#555',
  },

  compactInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#FFFFFF',
  },

  loading: {
    paddingVertical: 12,
    color: '#555',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#F7F7F7',
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 26,
    color: '#333',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },

  emptyText: {
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },

  addButton: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },

  addIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#E9E9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },

  addIconText: {
    fontSize: 19,
    color: '#333',
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  saveButton: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    marginTop: 4,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});