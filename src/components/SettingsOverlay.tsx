import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, TouchableWithoutFeedback } from 'react-native';
import { useHabit } from '../context/HabitContext';

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#10b981',
  '#0ea5e9', '#8b5cf6', '#ec4899', '#64748b'
];

const CYCLE_DURATIONS = [7, 14, 21, 30, 60, 90];

const PRESET_TIMES = [
  { label: '08:00', hour: 8, minute: 0 },
  { label: '12:00', hour: 12, minute: 0 },
  { label: '18:00', hour: 18, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
  { label: '22:00', hour: 22, minute: 0 },
];

interface SettingsOverlayProps {
  visible: boolean;
  onClose: () => void;
  onOpenThemePicker: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ visible, onClose, onOpenThemePicker }) => {
  const {
    cycleDuration,
    habitColor,
    appSettings,
    updateSettings,
    updateActiveHabitConfig,
  } = useHabit();

  const currentTime = appSettings.notificationTime || { hour: 20, minute: 0 };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Réglages</Text>

              {/* Cycle Duration */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Durée du cycle (jours)</Text>
                <View style={styles.optionsRow}>
                  {CYCLE_DURATIONS.map((dur) => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.chip,
                        cycleDuration === dur && { backgroundColor: habitColor },
                      ]}
                      onPress={() => updateActiveHabitConfig({ cycleDuration: dur })}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          cycleDuration === dur && { color: '#000', fontWeight: '600' },
                        ]}
                      >
                        {dur}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Habit Color */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Couleur de l'habitude</Text>
                <View style={styles.paletteRow}>
                  {PALETTE.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        habitColor === c && styles.colorDotSelected,
                      ]}
                      onPress={() => updateActiveHabitConfig({ color: c })}
                    />
                  ))}
                </View>
              </View>

              {/* Daily Reminder Settings */}
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <View>
                    <Text style={styles.sectionLabel}>Rappel quotidien</Text>
                    <Text style={styles.sectionSublabel}>Notification neutre, sans rappel d'échec</Text>
                  </View>
                  <Switch
                    value={appSettings.notificationsEnabled}
                    onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
                    trackColor={{ false: '#333', true: habitColor }}
                    thumbColor="#fff"
                  />
                </View>

                {appSettings.notificationsEnabled && (
                  <View style={styles.optionsRow}>
                    {PRESET_TIMES.map((t) => {
                      const isSelected =
                        currentTime.hour === t.hour && currentTime.minute === t.minute;
                      return (
                        <TouchableOpacity
                          key={t.label}
                          style={[
                            styles.chip,
                            isSelected && { backgroundColor: habitColor },
                          ]}
                          onPress={() =>
                            updateSettings({
                              notificationTime: { hour: t.hour, minute: t.minute },
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && { color: '#000', fontWeight: '600' },
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Automatic Threshold Toggle */}
              <View style={styles.sectionRow}>
                <View>
                  <Text style={styles.sectionLabel}>Seuil de transition auto</Text>
                  <Text style={styles.sectionSublabel}>Suggérer le changement après X cycles</Text>
                </View>
                <Switch
                  value={appSettings.autoTransitionEnabled}
                  onValueChange={(val) => updateSettings({ autoTransitionEnabled: val })}
                  trackColor={{ false: '#333', true: habitColor }}
                  thumbColor="#fff"
                />
              </View>

              {/* Theme Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Apparence</Text>
                <TouchableOpacity style={styles.themeButton} onPress={onOpenThemePicker}>
                  <Text style={styles.themeButtonText}>Sélectionner un Thème</Text>
                  <Text style={styles.themeButtonArrow}>→</Text>
                </TouchableOpacity>
              </View>

              {/* Close Button */}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 28,
    gap: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 1,
  },
  section: {
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#eee',
    fontSize: 15,
    fontWeight: '400',
  },
  sectionSublabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  chipText: {
    color: '#aaa',
    fontSize: 13,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  themeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  themeButtonArrow: {
    color: '#666',
    fontSize: 18,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#fff',
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  closeBtnText: {
    color: '#aaa',
    fontSize: 14,
  },
});
