import { ThemeProvider } from "next-themes";
import { AppContent } from "./AppContent";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="ui-theme"
    >
      <AppContent />
      <Toaster richColors style={{ fontFamily: "inherit" }} />
    </ThemeProvider>
  );
}

export default App;
