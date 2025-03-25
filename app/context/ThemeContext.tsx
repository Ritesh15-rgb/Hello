import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';
type TextSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  getFontSize: (baseSize: number) => number;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  textSize: 'medium',
  setTextSize: () => {},
  getFontSize: () => 0,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme as Theme || 'light');
  const [textSize, setTextSize] = useState<TextSize>('medium');

  useEffect(() => {
    setTheme(systemColorScheme as Theme || 'light');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const getFontSize = (baseSize: number) => {
    const multiplier = {
      small: 0.8,
      medium: 1,
      large: 1.2,
    };
    return baseSize * multiplier[textSize];
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
        textSize,
        setTextSize,
        getFontSize,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);