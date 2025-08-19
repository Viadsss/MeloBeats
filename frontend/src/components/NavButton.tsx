import { NavLink, type To } from "react-router";
import { Button } from "./ui/button";

interface NavButtonProps extends React.ComponentProps<typeof Button> {
  to: To;
}

export const NavButton = ({
  to,
  children,
  className,
  ...props
}: NavButtonProps) => {
  return (
    <NavLink to={to} className={className}>
      {({ isActive }) => (
        <Button
          className="w-full"
          variant={isActive ? "default" : "ghost"}
          {...props}
        >
          {children}
        </Button>
      )}
    </NavLink>
  );
};
