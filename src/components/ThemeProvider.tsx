import React, { createContext, useState, useContext } from 'react';
import defaultTheme from './defaultTheme';

type Theme = typeof defaultTheme;

const ThemeContext: React.Context<{
  theme: Theme;
  setTheme: React.Dispatch<Theme>;
}> = createContext({
  theme: defaultTheme,
  setTheme: (theme: Theme) => {},
});
export const useTheme = () => useContext(ThemeContext);

type Props = {
  children: React.ReactNode;
};

const ThemeProvider: React.FC<Props> = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
