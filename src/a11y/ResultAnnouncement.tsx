import type { HTMLAttributes } from "react";
import { usePaletteContext } from "../Palette.js";
import {
  formatResultCount,
  useResultAnnouncement,
} from "./useResultAnnouncement.js";

export interface ResultAnnouncementProps extends HTMLAttributes<HTMLDivElement> {
  /** Milliseconds to wait after the last count change. */
  delay?: number;
  /** Replaces the default "N results" wording. */
  format?: (count: number) => string;
}

/**
 * Politely announces result-count changes. Render it inside
 * `CommandPalette.Root`; style it however you hide content visually.
 */
export function ResultAnnouncement({
  delay = 400,
  format = formatResultCount,
  ...rest
}: ResultAnnouncementProps) {
  const api = usePaletteContext("CommandPalette.ResultAnnouncement");
  const message = useResultAnnouncement(api.results.length, delay, format);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" {...rest}>
      {message}
    </div>
  );
}
