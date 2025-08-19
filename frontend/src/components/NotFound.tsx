import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="absolute top-1/2 left-1/2 mb-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center">
      <span className="from-foreground bg-gradient-to-b to-transparent bg-clip-text text-[10rem] leading-none font-extrabold text-transparent">
        404
      </span>
      <h2 className="font-heading my-2 text-2xl font-bold">
        Something's not right...
      </h2>
      <p>
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={() => navigate(-1)} variant="default" size="lg">
          Go back
        </Button>
        <Button onClick={() => navigate("/")} variant="ghost" size="lg">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
