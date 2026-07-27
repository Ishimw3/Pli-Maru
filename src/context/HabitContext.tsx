import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  AppData,
  HabitData,
  CompletedCycle,
  AppSettings,
  DEFAULT_APP_DATA,
  loadAppData,
  saveAppData,
  todayKey,
  getYesterdayKey,
  generateId,
} from '../storage/habitStorage';
import { syncDailyReminder } from '../services/notificationService';

// ─── Context Types ───────────────────────────────────────────

interface HabitContextType {
  isLoaded: boolean;
  activeHabit: HabitData | null;
  isCheckedToday: boolean;
  cycleProgress: number;
  currentCycleDays: number;
  cycleDuration: number;
  completedCycles: CompletedCycle[];
  habitColor: string;
  toggleCheckIn: () => void;
  createHabit: (name: string, color: string, cycleDuration?: number) => void;
  transitionToNewHabit: (newColor: string) => void;
  totalCheckedDays: number;
  completedHabitsCount: number;
  pastHabitsHistory: string[];
  appSettings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateActiveHabitConfig: (config: { cycleDuration?: number; color?: string }) => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

// ─── Cycle Calculation ───────────────────────────────────────

function computeCycleState(
  checkedDates: string[],
  cycleDuration: number,
  existingCycles: CompletedCycle[],
  wastedDays: number,
  sortedDates?: string[],
): {
  currentCycleDays: number;
  cycleProgress: number;
  newlyCompletedCycles: CompletedCycle[];
} {
  const totalChecked = checkedDates.length;
  const previouslyCompleted = existingCycles.length;
  
  // Total checked days contributing to cycles
  const effectiveChecked = totalChecked - wastedDays;
  
  const totalFullCycles = Math.floor(effectiveChecked / cycleDuration);
  const currentCycleDays = effectiveChecked % cycleDuration;
  const cycleProgress = currentCycleDays / cycleDuration;

  // Determine if new cycles were completed since last save
  const newlyCompletedCycles: CompletedCycle[] = [];
  if (totalFullCycles > previouslyCompleted) {
    const dates = sortedDates || [...checkedDates].sort();
    for (let i = previouslyCompleted; i < totalFullCycles; i++) {
      const completionIndex = (i + 1) * cycleDuration - 1 + wastedDays;
      const completionDate = dates[completionIndex] || todayKey();
      const dotAngle = (i * 137.508) % 360; // Golden angle for natural spacing

      newlyCompletedCycles.push({
        completedAt: completionDate,
        dotAngle,
      });
    }
  }

  return { currentCycleDays, cycleProgress, newlyCompletedCycles };
}

// ─── Provider ────────────────────────────────────────────────

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appData, setAppData] = useState<AppData>(DEFAULT_APP_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAppData().then((data) => {
      setAppData(data);
      setIsLoaded(true);
      // Sync notifications on initial load
      if (data.settings) {
        syncDailyReminder(
          data.settings.notificationsEnabled,
          data.settings.notificationTime
        );
      }
    });
  }, []);

  const scheduleSave = useCallback((data: AppData) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveAppData(data);
    }, 300);
  }, []);

  // ─── Missed Day Detection ──────────────────────────────────
  
  useEffect(() => {
    if (!isLoaded || !appData.activeHabitId) return;

    const checkMissedDays = () => {
      setAppData((prev) => {
        const activeHabit = prev.habits.find((h) => h.id === prev.activeHabitId);
        if (!activeHabit) return prev;

        const today = todayKey();
        const yesterday = getYesterdayKey();
        const checkedToday = activeHabit.checkedDates.includes(today);
        const checkedYesterday = activeHabit.checkedDates.includes(yesterday);
        
        const { currentCycleDays } = computeCycleState(
          activeHabit.checkedDates,
          activeHabit.cycleDuration,
          activeHabit.completedCycles,
          activeHabit.wastedDays || 0
        );

        if (!checkedYesterday && !checkedToday && currentCycleDays > 0) {
          const habits = prev.habits.map((h) => {
            if (h.id === prev.activeHabitId) {
              return {
                ...h,
                wastedDays: (h.wastedDays || 0) + currentCycleDays,
              };
            }
            return h;
          });
          const newData = { ...prev, habits };
          scheduleSave(newData);
          return newData;
        }
        return prev;
      });
    };

    // Check immediately when habit becomes active or app loads
    checkMissedDays();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkMissedDays();
      }
    });

    return () => subscription.remove();
  }, [isLoaded, appData.activeHabitId, scheduleSave]);


  // ─── Derived State ──────────────────────────────────────

  const activeHabit = appData.habits.find((h) => h.id === appData.activeHabitId) || null;

  const today = todayKey();
  const isCheckedToday = activeHabit ? activeHabit.checkedDates.includes(today) : false;

  const sortedDates = activeHabit ? [...activeHabit.checkedDates].sort() : [];
  const cycleDuration = activeHabit?.cycleDuration || 30;
  const existingCycles = activeHabit?.completedCycles || [];
  const { currentCycleDays, cycleProgress } = activeHabit
    ? computeCycleState(activeHabit.checkedDates, cycleDuration, existingCycles, activeHabit.wastedDays || 0, sortedDates)
    : { currentCycleDays: 0, cycleProgress: 0 };

  const totalCheckedDays = appData.habits.reduce(
    (sum, h) => sum + h.checkedDates.length,
    0
  );
  const completedHabitsCount = appData.habits.filter((h) => !h.isActive).length;
  const pastHabitsHistory = appData.habits
    .filter((h) => !h.isActive)
    .map((h) => h.color);

  // ─── Actions ────────────────────────────────────────────

  const toggleCheckIn = useCallback(() => {
    if (!activeHabit) return;

    setAppData((prev) => {
      const habits = prev.habits.map((h) => {
        if (h.id !== prev.activeHabitId) return h;

        let newCheckedDates: string[];
        if (h.checkedDates.includes(today)) {
          newCheckedDates = h.checkedDates.filter((d) => d !== today);
        } else {
          newCheckedDates = [...h.checkedDates, today];
        }

        const sorted = [...newCheckedDates].sort();
        const { newlyCompletedCycles } = computeCycleState(
          newCheckedDates,
          h.cycleDuration,
          h.completedCycles,
          h.wastedDays || 0,
          sorted,
        );

        return {
          ...h,
          checkedDates: newCheckedDates,
          completedCycles: [...h.completedCycles, ...newlyCompletedCycles],
        };
      });

      const newData = { ...prev, habits };
      scheduleSave(newData);
      return newData;
    });
  }, [activeHabit, today, scheduleSave]);

  const createHabit = useCallback(
    (name: string, color: string, duration: number = 30) => {
      const newHabit: HabitData = {
        id: generateId(),
        name,
        color,
        cycleDuration: duration,
        checkedDates: [],
        completedCycles: [],
        createdAt: new Date().toISOString(),
        wastedDays: 0,
        isActive: true,
      };

      setAppData((prev) => {
        const habits = prev.habits.map((h) => ({ ...h, isActive: false }));
        habits.push(newHabit);
        const newData: AppData = { ...prev, activeHabitId: newHabit.id, habits };
        scheduleSave(newData);
        return newData;
      });
    },
    [scheduleSave],
  );

  const transitionToNewHabit = useCallback(
    (newColor: string) => {
      setAppData((prev) => {
        // Mark the current active habit as inactive
        const habits = prev.habits.map((h) =>
          h.id === prev.activeHabitId ? { ...h, isActive: false } : h
        );

        // Create the new habit
        const newHabit: HabitData = {
          id: generateId(),
          name: '', // Minimalist rule: no text input by default for transition
          color: newColor,
          cycleDuration: 30, // Default configurable later
          checkedDates: [],
          completedCycles: [],
          createdAt: new Date().toISOString(),
          wastedDays: 0,
          isActive: true,
        };

        habits.push(newHabit);
        const newData: AppData = {
          ...prev,
          activeHabitId: newHabit.id,
          habits,
        };
        scheduleSave(newData);
        return newData;
      });
    },
    [scheduleSave]
  );

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setAppData((prev) => {
        const updatedSettings = {
          ...prev.settings,
          ...newSettings,
        };
        const newData: AppData = {
          ...prev,
          settings: updatedSettings,
        };
        scheduleSave(newData);
        syncDailyReminder(
          updatedSettings.notificationsEnabled,
          updatedSettings.notificationTime
        );
        return newData;
      });
    },
    [scheduleSave]
  );

  const updateActiveHabitConfig = useCallback(
    (config: { cycleDuration?: number; color?: string }) => {
      setAppData((prev) => {
        if (!prev.activeHabitId) return prev;
        const habits = prev.habits.map((h) => {
          if (h.id === prev.activeHabitId) {
            return {
              ...h,
              cycleDuration: config.cycleDuration ?? h.cycleDuration,
              color: config.color ?? h.color,
            };
          }
          return h;
        });
        const newData = { ...prev, habits };
        scheduleSave(newData);
        return newData;
      });
    },
    [scheduleSave]
  );

  const value: HabitContextType = {
    isLoaded,
    activeHabit,
    isCheckedToday,
    cycleProgress,
    currentCycleDays,
    cycleDuration,
    completedCycles: existingCycles,
    habitColor: activeHabit?.color || '#8b5cf6',
    toggleCheckIn,
    createHabit,
    transitionToNewHabit,
    totalCheckedDays,
    completedHabitsCount,
    pastHabitsHistory,
    appSettings: appData.settings,
    updateSettings,
    updateActiveHabitConfig,
  };

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

export const useHabit = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabit must be used within HabitProvider');
  return context;
};
