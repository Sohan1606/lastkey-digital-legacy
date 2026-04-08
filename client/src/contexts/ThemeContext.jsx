import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({ theme: 'dark', isDark: true, toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('lastkey-theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
