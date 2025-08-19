export const formatDuration = (
  duration: number,
  unit: "seconds" | "milliseconds" = "seconds",
) => {
  const seconds =
    unit === "milliseconds" ? Math.floor(duration / 1000) : duration;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
