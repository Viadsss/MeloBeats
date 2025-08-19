import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  SheetFooter,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Github, Menu, Music4Icon } from "lucide-react";
import { NavButton } from "../NavButton";
import { Link } from "react-router";
import { ThemeToggle } from "../ThemeToggle";
import { Separator } from "../ui/separator";

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/how", label: "How it Works" },
    { href: "/faq", label: "FAQ" },
    { href: "/changelog", label: "Changelog" },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b border-dashed backdrop-blur">
      <div className="container mx-auto border-x border-dashed px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center space-x-2 transition-all duration-300 ease-in-out"
          >
            <Music4Icon className="bg-primary size-8 rounded-tr-2xl rounded-bl-2xl p-1 text-black transition-transform duration-300 group-hover:rotate-12" />
            <span className="group-hover:text-primary text-lg font-semibold transition-colors duration-300">
              MeloBeats
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-x-6 md:flex">
            <div className="flex items-center gap-x-2">
              {navLinks.map((link) => (
                <NavButton key={link.href} to={link.href}>
                  {link.label}
                </NavButton>
              ))}
            </div>
            <div className="flex items-center gap-x-2">
              <ThemeToggle />
              <Button variant="outline" size="icon" asChild>
                <a
                  href="https://github.com/my-repo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation - Theme Toggle, GitHub, and Menu */}
          <div className="flex items-center gap-x-2 md:hidden">
            <ThemeToggle />
            <Button variant="outline" size="icon" asChild>
              <a
                href="https://github.com/my-repo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <Link
                    to="/"
                    className="group flex items-center space-x-2 transition-all duration-300 ease-in-out"
                  >
                    <Music4Icon className="bg-primary size-8 rounded-tr-2xl rounded-bl-2xl p-1 text-black transition-transform duration-300 group-hover:rotate-12" />
                    <span className="group-hover:text-primary text-lg font-semibold transition-colors duration-300">
                      MeloBeats
                    </span>
                  </Link>
                  <Separator />
                </SheetHeader>

                <div className="flex flex-col items-center gap-4 px-4">
                  {navLinks.map((link) => (
                    <NavButton
                      key={link.href}
                      to={link.href}
                      onClick={handleNavClick}
                      className="w-full rounded-2xl text-center"
                    >
                      {link.label}
                    </NavButton>
                  ))}
                </div>

                <SheetFooter className="flex flex-col gap-2 sm:flex-col">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Built with ❤️ for music lovers
                    </span>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
