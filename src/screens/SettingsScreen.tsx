import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getWeight, setWeight, getGoals, setGoals, DEFAULT_GOALS } from '../storage/settingsStorage';
import { UserGoals } from '../types';

export default function SettingsScreen() {
  const [weightInput, setWeightInput] = useState('');
  const [savedWeight, setSavedWeight] = useState(false);

  const [calorieGoal, setCalorieGoal] = useState('');
  const [minutesGoal, setMinutesGoal] = useState('');
  const [daysGoal, setDaysGoal] = useState('');
  const [savedGoals, setSavedGoals] = useState(false);

  useEffect(() => {
    getWeight().then((w) => setWeightInput(String(w)));
    getGoals().then((g) => {
      setCalorieGoal(String(g.dailyCalories));
      setMinutesGoal(String(g.dailyActiveMinutes));
      setDaysGoal(String(g.weeklyActiveDays));
    });
  }, []);

  async function handleSaveWeight() {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
      Alert.alert('Invalid weight', 'Please enter a value between 1 and 500 kg.');
      return;
    }
    await setWeight(parsed);
    setSavedWeight(true);
    setTimeout(() => setSavedWeight(false), 2000);
  }

  async function handleSaveGoals() {
    const cal = parseInt(calorieGoal, 10);
    const min = parseInt(minutesGoal, 10);
    const days = parseInt(daysGoal, 10);

    if (isNaN(cal) || cal < 1 || cal > 10000) {
      Alert.alert('Invalid calorie goal', 'Enter a value between 1 and 10,000 kcal.');
      return;
    }
    if (isNaN(min) || min < 1 || min > 1440) {
      Alert.alert('Invalid minutes goal', 'Enter a value between 1 and 1,440 minutes.');
      return;
    }
    if (isNaN(days) || days < 1 || days > 7) {
      Alert.alert('Invalid days goal', 'Enter a value between 1 and 7 days.');
      return;
    }

    const goals: UserGoals = {
      dailyCalories: cal,
      dailyActiveMinutes: min,
      weeklyActiveDays: days,
    };
    await setGoals(goals);
    setSavedGoals(true);
    setTimeout(() => setSavedGoals(false), 2000);
  }

  function handleResetGoals() {
    setCalorieGoal(String(DEFAULT_GOALS.dailyCalories));
    setMinutesGoal(String(DEFAULT_GOALS.dailyActiveMinutes));
    setDaysGoal(String(DEFAULT_GOALS.weeklyActiveDays));
    setSavedGoals(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Settings</Text>

        {/* Weight Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Your Weight</Text>
          <Text style={styles.sublabel}>Used to calculate calories burned</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={(v) => {
                setWeightInput(v);
                setSavedWeight(false);
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
            style={[styles.button, savedWeight && styles.buttonSaved]}
            onPress={handleSaveWeight}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>{savedWeight ? 'Saved ✓' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Goals Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Daily & Weekly Goals</Text>
          <Text style={styles.sublabel}>Set targets to track your progress</Text>

          <GoalInput
            label="Daily Calorie Goal"
            value={calorieGoal}
            onChangeText={(v) => { setCalorieGoal(v); setSavedGoals(false); }}
            unit="kcal"
            placeholder={String(DEFAULT_GOALS.dailyCalories)}
          />
          <GoalInput
            label="Daily Active Minutes"
            value={minutesGoal}
            onChangeText={(v) => { setMinutesGoal(v); setSavedGoals(false); }}
            unit="min"
            placeholder={String(DEFAULT_GOALS.dailyActiveMinutes)}
          />
          <GoalInput
            label="Weekly Active Days"
            value={daysGoal}
            onChangeText={(v) => { setDaysGoal(v); setSavedGoals(false); }}
            unit="days"
            placeholder={String(DEFAULT_GOALS.weeklyActiveDays)}
            maxLength={1}
          />

          <View style={styles.goalButtonRow}>
            <TouchableOpacity
              style={[styles.button, styles.goalButton, savedGoals && styles.buttonSaved]}
              onPress={handleSaveGoals}
              activeOpacity={0.8}>
              <Text style={styles.buttonText}>{savedGoals ? 'Saved ✓' : 'Save Goals'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleResetGoals}
              activeOpacity={0.8}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoalInput({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  maxLength = 5,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit: string;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <View style={goalStyles.container}>
      <Text style={goalStyles.label}>{label}</Text>
      <View style={goalStyles.inputRow}>
        <TextInput
          style={goalStyles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor="#636366"
          maxLength={maxLength}
        />
        <Text style={goalStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const goalStyles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#AEAEB2',
    fontWeight: '600',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10,
  },
  unit: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
    width: 40,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
  goalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  goalButton: {
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: 80,
  },
  resetButtonText: {
    color: '#AEAEB2',
    fontSize: 16,
    fontWeight: '700',
  },
});
