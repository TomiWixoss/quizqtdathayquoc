import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ClockProps {
  className?: string;
}

function Clock({ className }: ClockProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedTime = now.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      setTime(formattedTime);
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <p className={cn("font-mono text-sm text-muted-foreground", className)}>
      {time}
    </p>
  );
}

export default Clock;
