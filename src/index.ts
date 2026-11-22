export { filterItems } from "./filter.js";
export type { PaletteItem } from "./filter.js";

export { useCommandPalette } from "./useCommandPalette.js";
export type {
  CommandPaletteApi,
  PaletteInputProps,
  PaletteItemProps,
  PaletteListProps,
  PaletteRootProps,
  UseCommandPaletteOptions,
} from "./useCommandPalette.js";

export { CommandPalette, usePaletteContext } from "./Palette.js";

export { ResultAnnouncement } from "./a11y/ResultAnnouncement.js";
export type { ResultAnnouncementProps } from "./a11y/ResultAnnouncement.js";
export {
  formatResultCount,
  useResultAnnouncement,
} from "./a11y/useResultAnnouncement.js";
