import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useHabit } from '../context/HabitContext';

const COLORS = [
  '#ef4444', // Coral
  '#f97316', // Orange
  '#eab308', // Amber
  '#10b981', // Emerald
  '#0ea5e9', // Sky
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b'  // Slate
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const TransitionOverlay: React.FC<Props> = ({ visible, onClose }) => {
  const { transitionToNewHabit } = useHabit();
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[5]);

  const handleConfirm = () => {
    transitionToNewHabit(selectedColor);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.prompt}>
            Prêt à valider cette habitude et en commencer une nouvelle ?
          </Text>
          
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorCircleSelected
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.btn}>
              <Text style={styles.btnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={[styles.btn, { backgroundColor: selectedColor }]}>
              <Text style={[styles.btnText, { color: '#000' }]}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#111',
    padding: 35,
    borderRadius: 24,
    alignItems: 'center',
  },
  prompt: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 28,
    fontWeight: '300',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 45,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  btnText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '500',
  }
});
