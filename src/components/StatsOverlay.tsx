import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useHabit } from '../context/HabitContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const StatsOverlay: React.FC<Props> = ({ visible, onClose }) => {
  const { totalCheckedDays, completedHabitsCount, pastHabitsHistory, habitColor } = useHabit();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Top drag indicator handle */}
              <View style={styles.handle} />

              <View style={styles.content}>
                {/* Total Days Checked */}
                <View style={styles.statGroup}>
                  <Text style={styles.statNumber}>{totalCheckedDays}</Text>
                  <Text style={styles.statLabel}>jours cochés au total</Text>
                </View>

                {/* Habits Completed */}
                <View style={styles.statGroup}>
                  <Text style={styles.statNumber}>{completedHabitsCount}</Text>
                  <Text style={styles.statLabel}>habitudes accomplies</Text>
                </View>

                {/* History of Past Habits (Color Dots) */}
                {pastHabitsHistory.length > 0 && (
                  <View style={styles.historySection}>
                    <View style={styles.dotsRow}>
                      {pastHabitsHistory.map((color, index) => (
                        <View
                          key={`past-habit-${index}`}
                          style={[styles.historyDot, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#101010',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 60,
    paddingHorizontal: 24,
    minHeight: '45%',
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 40,
  },
  statGroup: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '200',
    color: '#F5F5F5',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '300',
    color: '#888',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  historySection: {
    marginTop: 10,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    maxWidth: 240,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
