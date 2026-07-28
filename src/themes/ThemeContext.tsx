import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { minimalTheme } from './minimal';
import { telecommandeTheme } from './telecommande';
import { minuteurSportTheme } from './minuteur';
import { sabreLaserTheme } from './sabre';
import { useHabit } from '../context/HabitContext';
import type { ThemeDefinition } from './types';

// ─── Theme Registry ──────────────────────────────────────────

/** All available themes. New themes are registered here. */
const THEME_REGISTRY: ThemeDefinition[] = [minimalTheme, telecommandeTheme, minuteurSportTheme, sabreLaserTheme];

// ─── Context Type ────────────────────────────────────────────

interface ThemeContextType {
  /** The currently active theme definition */
  activeTheme: ThemeDefinition;
  /** All available themes for the picker */
  themes: ThemeDefinition[];
  /** Switch the active theme by id */
  setActiveTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appSettings, updateSettings } = useHabit();

  const activeThemeId = appSettings.activeThemeId || 'minimal';

  const activeTheme =
    THEME_REGISTRY.find((t) => t.id === activeThemeId) || minimalTheme;

  const setActiveTheme = useCallback(
    (id: string) => {
      // Only accept known theme ids
      const exists = THEME_REGISTRY.some((t) => t.id === id);
      if (exists) {
        updateSettings({ activeThemeId: id });
      }
    },
    [updateSettings],
  );

  const value: ThemeContextType = {
    activeTheme,
    themes: THEME_REGISTRY,
    setActiveTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ─── Hook ────────────────────────────────────────────────────

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
