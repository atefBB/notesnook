import { useStore } from "../../stores/theme-store";
import { ThemeProvider as EmotionThemeProvider } from "emotion-theming";
import { useTheme } from "@streetwriters/theme";

function ThemeProviderWrapper(props) {
  const theme = useStore((store) => store.theme);
  const accent = useStore((store) => store.accent);
  const themeProperties = useTheme({ accent, theme });

  return (
    <EmotionThemeProvider theme={themeProperties}>
      {props.children instanceof Function
        ? props.children(themeProperties)
        : props.children}
    </EmotionThemeProvider>
  );
}
export default ThemeProviderWrapper;