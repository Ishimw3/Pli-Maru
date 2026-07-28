import type { CompletedCycle } from '../storage/habitStorage';

// ─── Theme Props (AGENTS.md §13 — strict interface) ─────────

/**
 * Read-only state injected into every theme.
 *
 * The four prescribed props are:
 *   isCheckedToday, cycleProgressPercent, completedCyclesCount, habitColor
 *
 * Additional props carry rendering data (dots) and gesture callbacks.
 * A theme NEVER writes to or derives business logic from these props.
 */
export interface ThemeProps {
  // §13 — Prescribed state
  isCheckedToday: boolean;
  cycleProgressPercent: number;   // 0–100
  completedCyclesCount: number;   // integer
  habitColor: string;             // hex or HSL

  // Dot positions for cycle completion rendering
  completedCycles: CompletedCycle[];

  // Gesture callbacks — the theme dispatches, core decides
  onToggleCheckIn: () => void;
  onOpenTransition: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;

  // Ephemeral long-press day count (§10 — gesture-gated info)
  onLongPressStart: () => void;
  onLongPressEnd: () => void;
  currentCycleDays: number;
  showDays: boolean;
  soundEnabled: boolean;
}

// ─── Theme Definition ────────────────────────────────────────

export interface ThemeDefinition {
  /** Unique identifier, e.g. 'minimal' */
  id: string;
  /** Display name for the theme picker */
  name: string;
  /** React component implementing ThemeProps */
  component: React.ComponentType<ThemeProps>;
  /** Optional premium status */
  isPremium?: boolean;
}
