import { useTheme } from "next-themes";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { ThemeToggle } from "./components/ThemeToggle";

export function AppContent() {
  const { theme, setTheme } = useTheme();

  const handleClick = (theme: string) => {
    toast.success(`Theme changed to ${theme}`);
    setTheme(theme);
  };

  return (
    <div className="bg-background">
      The current theme is: {theme}
      <Button variant="outline" onClick={() => handleClick("light")}>
        Light Mode
      </Button>
      <Button onClick={() => handleClick("dark")}>Dark Mode</Button>
      <code>Hello World</code>
      <ThemeToggle />
    </div>
  );
}
