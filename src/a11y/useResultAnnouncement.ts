import { useEffect, useRef, useState } from "react";

export function formatResultCount(count: number): string {
  if (count === 0) return "No results";
  return count === 1 ? "1 result" : `${count} results`;
}

/**
 * Debounced announcement text for a changing result count. Returns `""` until
 * the count actually changes, so mounting the live region stays silent.
 */
export function useResultAnnouncement(
  count: number,
  delay = 400,
  format: (count: number) => string = formatResultCount,
): string {
  const [message, setMessage] = useState("");
  const previous = useRef(count);

  useEffect(() => {
    if (count === previous.current) return;
    previous.current = count;
    const timer = setTimeout(() => setMessage(format(count)), delay);
    return () => clearTimeout(timer);
  }, [count, delay, format]);

  return message;
}
