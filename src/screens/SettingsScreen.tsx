import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getWeight, setWeight } from '../storage/settingsStorage';

export default function SettingsScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getWeight().then((w) => setWeightInput(String(w)));
  }, []);

  async function handleSave() {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      Alert.alert('Invalid weight', 'Please enter a value between 1 and 500 kg.');
      return;
    }
    await setWeight(parsed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your Weight</Text>
        <Text style={styles.sublabel}>
          Used to calculate calories burned (MET formula)
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={weightInput}
            onChangeText={(v) => {
              setWeightInput(v);
              setSaved(false);
            }}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="70"
            placeholderTextColor="#636366"
            maxLength={6}
          />
          <Text style={styles.unit}>kg</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, saved && styles.buttonSaved]}
          onPress={handleSave}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>{saved ? 'Saved ✓' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoTitle}>MET Values Used</Text>
      <View style={styles.metCard}>
        <MetRow activity="🚶 Walking" met="3.5" />
        <MetRow activity="🏃 Running" met="8.0" />
      </View>
    </KeyboardAvoidingView>
  );
}

function MetRow({ activity, met }: { activity: string; met: string }) {
  return (
    <View style={metStyles.row}>
      <Text style={metStyles.activity}>{activity}</Text>
      <Text style={metStyles.met}>MET {met}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10,
  },
  unit: {
    color: '#AEAEB2',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonSaved: {
    backgroundColor: '#30D158',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoTitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  metCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});

const metStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  activity: {
    color: '#fff',
    fontSize: 15,
  },
  met: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '600',
  },
});
