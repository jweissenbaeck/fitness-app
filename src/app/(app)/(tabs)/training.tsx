import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/lib/supabase';

type ActivityType = 'gym' | 'rest' | 'custom';

type RotationDay = {
  weekday: number;
  activity_type: ActivityType | null;
  template_id: string | null;
};

type WorkoutTemplate = {
  id: string;
  name: string;
};

const weekdays = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

export default function TrainingScreen() {
  const [rotation, setRotation] = useState<RotationDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showGymSelection, setShowGymSelection] = useState(false);

  useEffect(() => {
    loadRotation();
    loadTemplates();
  }, []);

  async function loadRotation() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('weekly_rotation')
      .select('weekday, activity_type, template_id')
      .eq('user_id', user.id)
      .order('weekday');

    setLoading(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Die Wochenrotation konnte nicht geladen werden.'
      );
      console.error(error);
      return;
    }

    const days: RotationDay[] = weekdays.map((_, index) => {
      const weekday = index + 1;

      const existingDay = data?.find(
        (day) => day.weekday === weekday
      );

      return {
        weekday,
        activity_type: existingDay?.activity_type ?? null,
        template_id: existingDay?.template_id ?? null,
      };
    });

    setRotation(days);
  }

  async function loadTemplates() {
    setTemplatesLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTemplatesLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('workout_templates')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false,
      });

    setTemplatesLoading(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Deine Trainingsvorlagen konnten nicht geladen werden.'
      );
      console.error(error);
      return;
    }

    setTemplates(data ?? []);
  }

  async function selectActivity(activityType: ActivityType) {
    if (selectedDay === null) {
      return;
    }

    if (activityType === 'gym') {
      await loadTemplates();
      setShowGymSelection(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('weekly_rotation')
      .upsert(
        {
          user_id: user.id,
          weekday: selectedDay,
          activity_type: activityType,
          template_id: null,
          custom_activity_id: null,
        },
        {
          onConflict: 'user_id,weekday',
        }
      );

    setSaving(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Die Auswahl konnte nicht gespeichert werden.'
      );
      console.error(error);
      return;
    }

    setRotation((currentRotation) =>
      currentRotation.map((day) =>
        day.weekday === selectedDay
          ? {
              ...day,
              activity_type: activityType,
              template_id: null,
            }
          : day
      )
    );

    setSelectedDay(null);
    setShowGymSelection(false);
  }

  async function selectTemplate(templateId: string) {
    if (selectedDay === null) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('weekly_rotation')
      .upsert(
        {
          user_id: user.id,
          weekday: selectedDay,
          activity_type: 'gym',
          template_id: templateId,
          custom_activity_id: null,
        },
        {
          onConflict: 'user_id,weekday',
        }
      );

    setSaving(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Das Training konnte nicht zugewiesen werden.'
      );
      console.error(error);
      return;
    }

    setRotation((currentRotation) =>
      currentRotation.map((day) =>
        day.weekday === selectedDay
          ? {
              ...day,
              activity_type: 'gym',
              template_id: templateId,
            }
          : day
      )
    );

    setSelectedDay(null);
    setShowGymSelection(false);
  }

  function createNewTraining() {
    if (selectedDay === null) {
      return;
    }

    router.push({
      pathname: '/training-editor',
      params: {
        weekday: selectedDay.toString(),
      },
    });
  }

  async function deleteRotationDay() {
    if (selectedDay === null) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('weekly_rotation')
      .delete()
      .eq('user_id', user.id)
      .eq('weekday', selectedDay);

    setSaving(false);

    if (error) {
      Alert.alert(
        'Fehler',
        'Die Planung konnte nicht gelöscht werden.'
      );
      console.error(error);
      return;
    }

    setRotation((currentRotation) =>
      currentRotation.map((day) =>
        day.weekday === selectedDay
          ? {
              ...day,
              activity_type: null,
              template_id: null,
            }
          : day
      )
    );

    setSelectedDay(null);
    setShowGymSelection(false);
  }

  function handleDayPress(weekday: number) {
    setSelectedDay(weekday);
    setShowGymSelection(false);
  }

  function getActivityLabel(
    activityType: ActivityType | null,
    templateId: string | null
  ) {
    if (activityType === 'gym' && templateId) {
      const template = templates.find(
        (item) => item.id === templateId
      );

      return template?.name ?? 'Gym';
    }

    switch (activityType) {
      case 'gym':
        return 'Gym';

      case 'rest':
        return 'Rest Day';

      case 'custom':
        return 'Eigene Aktivität';

      default:
        return 'Noch nicht geplant';
    }
  }

  function getActivityStyle(
    activityType: ActivityType | null
  ) {
    switch (activityType) {
      case 'gym':
        return styles.activityGym;

      case 'rest':
        return styles.activityRest;

      case 'custom':
        return styles.activityCustom;

      default:
        return styles.activityEmpty;
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="title" style={styles.title}>
          Deine Woche
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Plane deine Woche und lege für jeden Tag eine Aktivität fest.
        </ThemedText>

        {loading ? (
          <ThemedText style={styles.loading}>
            Rotation wird geladen...
          </ThemedText>
        ) : (
          <View style={styles.days}>
            {rotation.map((day) => (
              <View key={day.weekday}>
                <Pressable
                  style={[
                    styles.dayCard,
                    selectedDay === day.weekday &&
                      styles.dayCardSelected,
                  ]}
                  onPress={() => handleDayPress(day.weekday)}
                >
                  <View style={styles.dayCardContent}>
                    <ThemedText style={styles.dayName}>
                      {weekdays[day.weekday - 1]}
                    </ThemedText>

                    <View
                      style={[
                        styles.activityBadge,
                        getActivityStyle(day.activity_type),
                      ]}
                    >
                      <View style={styles.activityDot} />

                      <ThemedText style={styles.activity}>
                        {getActivityLabel(
                          day.activity_type,
                          day.template_id
                        )}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={styles.arrow}>
                    ›
                  </ThemedText>
                </Pressable>

                {selectedDay === day.weekday && (
                  <View style={styles.selection}>
                    {!showGymSelection ? (
                      <>
                        <ThemedText
                          type="subtitle"
                          style={styles.selectionTitle}
                        >
                          {weekdays[day.weekday - 1]}
                        </ThemedText>

                        <ThemedText style={styles.selectionSubtitle}>
                          Was möchtest du an diesem Tag machen?
                        </ThemedText>

                        <Pressable
                          style={styles.option}
                          onPress={() => selectActivity('gym')}
                          disabled={saving}
                        >
                          <View style={styles.optionIcon}>
                            <ThemedText style={styles.optionIconText}>
                              G
                            </ThemedText>
                          </View>

                          <View style={styles.optionContent}>
                            <ThemedText style={styles.optionTitle}>
                              Gym
                            </ThemedText>

                            <ThemedText
                              style={styles.optionDescription}
                            >
                              Ein geplantes Krafttraining
                            </ThemedText>
                          </View>

                          <ThemedText style={styles.optionArrow}>
                            ›
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          style={styles.option}
                          onPress={() => selectActivity('rest')}
                          disabled={saving}
                        >
                          <View style={styles.optionIcon}>
                            <ThemedText style={styles.optionIconText}>
                              R
                            </ThemedText>
                          </View>

                          <View style={styles.optionContent}>
                            <ThemedText style={styles.optionTitle}>
                              Rest Day
                            </ThemedText>

                            <ThemedText
                              style={styles.optionDescription}
                            >
                              Kein Training an diesem Tag
                            </ThemedText>
                          </View>

                          <ThemedText style={styles.optionArrow}>
                            ›
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          style={styles.option}
                          onPress={() => selectActivity('custom')}
                          disabled={saving}
                        >
                          <View style={styles.optionIcon}>
                            <ThemedText style={styles.optionIconText}>
                              +
                            </ThemedText>
                          </View>

                          <View style={styles.optionContent}>
                            <ThemedText style={styles.optionTitle}>
                              Eigene Aktivität
                            </ThemedText>

                            <ThemedText
                              style={styles.optionDescription}
                            >
                              Eine eigene Aktivität eintragen
                            </ThemedText>
                          </View>

                          <ThemedText style={styles.optionArrow}>
                            ›
                          </ThemedText>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          style={styles.backButton}
                          onPress={() =>
                            setShowGymSelection(false)
                          }
                          disabled={saving}
                        >
                          <ThemedText style={styles.backArrow}>
                            ‹
                          </ThemedText>

                          <ThemedText style={styles.backText}>
                            Zurück
                          </ThemedText>
                        </Pressable>

                        <ThemedText
                          type="subtitle"
                          style={styles.selectionTitle}
                        >
                          Gym
                        </ThemedText>

                        <ThemedText style={styles.selectionSubtitle}>
                          Wähle ein vorhandenes Training aus.
                        </ThemedText>

                        {templatesLoading ? (
                          <ThemedText style={styles.loading}>
                            Trainings werden geladen...
                          </ThemedText>
                        ) : templates.length === 0 ? (
                          <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                              <ThemedText style={styles.emptyIconText}>
                                +
                              </ThemedText>
                            </View>

                            <ThemedText style={styles.emptyTitle}>
                              Noch kein Training
                            </ThemedText>

                            <ThemedText style={styles.emptyText}>
                              Erstelle deine erste Trainingsvorlage,
                              um sie einem Tag zuzuweisen.
                            </ThemedText>

                            <Pressable
                              style={styles.createButton}
                              onPress={createNewTraining}
                            >
                              <ThemedText
                                style={styles.createButtonText}
                              >
                                Neues Training erstellen
                              </ThemedText>
                            </Pressable>
                          </View>
                        ) : (
                          <>
                            {templates.map((template) => (
                              <Pressable
                                key={template.id}
                                style={styles.option}
                                onPress={() =>
                                  selectTemplate(template.id)
                                }
                                disabled={saving}
                              >
                                <View style={styles.optionIcon}>
                                  <ThemedText
                                    style={styles.optionIconText}
                                  >
                                    G
                                  </ThemedText>
                                </View>

                                <View style={styles.optionContent}>
                                  <ThemedText
                                    style={styles.optionTitle}
                                  >
                                    {template.name}
                                  </ThemedText>

                                  <ThemedText
                                    style={styles.optionDescription}
                                  >
                                    Training auswählen
                                  </ThemedText>
                                </View>

                                <ThemedText
                                  style={styles.optionArrow}
                                >
                                  ›
                                </ThemedText>
                              </Pressable>
                            ))}

                            <Pressable
                              style={styles.createButton}
                              onPress={createNewTraining}
                            >
                              <ThemedText
                                style={styles.createButtonText}
                              >
                                + Neues Training erstellen
                              </ThemedText>
                            </Pressable>
                          </>
                        )}
                      </>
                    )}

                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => {
                        setSelectedDay(null);
                        setShowGymSelection(false);
                      }}
                      disabled={saving}
                    >
                      <ThemedText style={styles.cancelButtonText}>
                        Abbrechen
                      </ThemedText>
                    </Pressable>

                    {day.activity_type !== null && (
                      <Pressable
                        style={styles.deleteButton}
                        onPress={deleteRotationDay}
                        disabled={saving}
                      >
                        <ThemedText style={styles.deleteButtonText}>
                          {saving
                            ? 'Löschen...'
                            : 'Planung löschen'}
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
  },

  title: {
    marginBottom: 8,
    color: '#222',
  },

  subtitle: {
    marginBottom: 24,
    color: '#555',
  },

  loading: {
    marginTop: 20,
    color: '#555',
  },

  days: {
    gap: 12,
  },

  dayCard: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dayCardSelected: {
    borderColor: '#333',
    borderWidth: 2,
  },

  dayCardContent: {
    flex: 1,
  },

  dayName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },

  activityBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 7,
    borderRadius: 999,
  },

  activityGym: {
    backgroundColor: '#E9E9E9',
  },

  activityRest: {
    backgroundColor: '#EEEEEE',
  },

  activityCustom: {
    backgroundColor: '#E9E9E9',
  },

  activityEmpty: {
    backgroundColor: '#F0F0F0',
  },

  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
    marginRight: 6,
  },

  activity: {
    fontSize: 13,
    color: '#555',
  },

  arrow: {
    fontSize: 28,
    color: '#444',
    marginLeft: 12,
  },

  selection: {
    marginTop: 8,
    marginBottom: 4,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
  },

  selectionTitle: {
    marginBottom: 4,
    color: '#222',
  },

  selectionSubtitle: {
    marginBottom: 16,
    color: '#555',
  },

  option: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  optionIconText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  optionDescription: {
    marginTop: 4,
    color: '#666',
  },

  optionArrow: {
    fontSize: 24,
    color: '#555',
    marginLeft: 10,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  backArrow: {
    fontSize: 24,
    color: '#222',
    marginRight: 5,
  },

  backText: {
    color: '#333',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 18,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 25,
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
    marginBottom: 16,
    lineHeight: 20,
  },

  createButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
    marginTop: 4,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  cancelButtonText: {
    color: '#444',
  },

  deleteButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  deleteButtonText: {
    color: '#555',
    fontWeight: '600',
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});