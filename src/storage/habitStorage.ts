import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Data Types ──────────────────────────────────────────────

/** A single completed cycle, with the date it was completed. */
export interface CompletedCycle {
  /** ISO date string (YYYY-MM-DD) when the cycle was completed */
  completedAt: string;
  /** Angular position (0–360) assigned when the dot was placed */
  dotAngle: number;
}

/** The full persisted state for one habit. */
export interface HabitData {
  id: string;
  name: string;
  color: string;
  cycleDuration: number; // days per cycle, default 30
  /** ISO date strings (YYYY-MM-DD) of every day that was checked in */
  checkedDates: string[];
  /** Completed cycles with their completion dates and dot positions */
  completedCycles: CompletedCycle[];
  /** ISO date when this habit was created */
  createdAt: string;
  /** Number of checked days that were lost due to missed days */
  wastedDays?: number;
  /** Whether this habit is currently active */
  isActive: boolean;
}

export interface AppSettings {
  autoTransitionEnabled: boolean;
  autoTransitionCycles: number; // Configurable number of cycles before suggesting transition
  notificationsEnabled: boolean;
  notificationTime: { hour: number; minute: number };
}

/** Root application state persisted in storage. */
export interface AppData {
  activeHabitId: string | null;
  habits: HabitData[];
  settings: AppSettings;
}

// ─── Storage Keys ────────────────────────────────────────────

const STORAGE_KEY = '@pli_maru/app_data';

// ─── Default State ───────────────────────────────────────────

export const DEFAULT_APP_DATA: AppData = {
  activeHabitId: null,
  habits: [],
  settings: {
    autoTransitionEnabled: false,
    autoTransitionCycles: 3,
    notificationsEnabled: false,
    notificationTime: { hour: 20, minute: 0 },
  },
};

// ─── Storage Operations ──────────────────────────────────────

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
    }
    return DEFAULT_APP_DATA;
  } catch {
    return DEFAULT_APP_DATA;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail — no punitive error UX
  }
}

// ─── Date Helpers ────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local timezone. */
export function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns yesterday's date as YYYY-MM-DD in local timezone. */
export function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Generate a simple unique ID. */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
