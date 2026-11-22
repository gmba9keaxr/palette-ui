import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from "react";
import { filterItems } from "./filter.js";
import type { PaletteItem } from "./filter.js";

export interface UseCommandPaletteOptions {
  items: readonly PaletteItem[];
  onSelect: (item: PaletteItem) => void;
  /** Replaces the built-in ranking. Return false to drop an item. */
  filter?: (item: PaletteItem, query: string) => boolean;
  maxResults?: number;
  initialOpen?: boolean;
}

export interface PaletteRootProps {
  role: "dialog";
  "aria-modal": true;
  "aria-label": string;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}

export interface PaletteInputProps {
  ref: RefObject<HTMLInputElement | null>;
  type: "text";
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  role: "combobox";
  "aria-expanded": true;
  "aria-controls": string;
  "aria-activedescendant": string | undefined;
  "aria-autocomplete": "list";
  "aria-label": string;
  autoComplete: "off";
  spellCheck: false;
}

export interface PaletteListProps {
  id: string;
  role: "listbox";
  "aria-label": string;
}

export interface PaletteItemProps {
  id: string;
  role: "option";
  "aria-selected": boolean;
  "aria-disabled": true | undefined;
  tabIndex: -1;
  onMouseMove: () => void;
  onClick: () => void;
}

export interface CommandPaletteApi {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: PaletteItem[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  move: (delta: number) => void;
  select: (index: number) => void;
  getRootProps: (label?: string) => PaletteRootProps;
  getInputProps: (label?: string) => PaletteInputProps;
  getListProps: (label?: string) => PaletteListProps;
  getItemProps: (index: number) => PaletteItemProps;
}

function firstEnabledIndex(items: readonly PaletteItem[]): number {
  const at = items.findIndex((item) => !item.disabled);
  return at < 0 ? 0 : at;
}

function lastEnabledIndex(items: readonly PaletteItem[]): number {
  for (let at = items.length - 1; at >= 0; at -= 1) {
    if (!items[at]?.disabled) return at;
  }
  return 0;
}

/**
 * Headless command palette state: open/close, ranking, roving active index
 * and the ARIA wiring a combobox/listbox pair needs. Rendering is up to you.
 */
export function useCommandPalette(
  options: UseCommandPaletteOptions,
): CommandPaletteApi {
  const {
    items,
    onSelect,
    filter,
    maxResults = 50,
    initialOpen = false,
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(() =>
    firstEnabledIndex(items.slice(0, maxResults)),
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const listId = `${baseId}-listbox`;

  const results = useMemo(() => {
    if (query.trim() === "") return items.slice(0, maxResults);
    if (filter) return items.filter((item) => filter(item, query)).slice(0, maxResults);
    return filterItems(items, query, maxResults);
  }, [items, query, filter, maxResults]);

  useEffect(() => {
    setActiveIndex(firstEnabledIndex(results));
  }, [query]);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(results.length - 1, 0)));
  }, [results.length]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen((current) => {
      if (current) return current;
      previousFocus.current = document.activeElement as HTMLElement | null;
      return true;
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, close, open]);

  const select = useCallback(
    (index: number) => {
      const item = results[index];
      if (!item || item.disabled) return;
      onSelect(item);
    },
    [results, onSelect],
  );

  const move = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const count = results.length;
        if (count === 0) return 0;
        let next = current;
        for (let step = 0; step < count; step += 1) {
          next = (next + delta + count) % count;
          if (!results[next]?.disabled) return next;
        }
        return current;
      });
    },
    [results],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          move(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          move(-1);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(firstEnabledIndex(results));
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(lastEnabledIndex(results));
          break;
        case "Enter":
          if (results.length > 0) {
            event.preventDefault();
            select(activeIndex);
          }
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
        default:
          break;
      }
    },
    [move, select, activeIndex, results, close],
  );

  const getRootProps = useCallback(
    (label = "Command palette"): PaletteRootProps => ({
      role: "dialog",
      "aria-modal": true,
      "aria-label": label,
      onKeyDown: handleKeyDown,
    }),
    [handleKeyDown],
  );

  const getInputProps = useCallback(
    (label = "Type a command"): PaletteInputProps => ({
      ref: inputRef,
      type: "text",
      value: query,
      onChange: (event) => setQuery(event.target.value),
      onKeyDown: handleKeyDown,
      role: "combobox",
      "aria-expanded": true,
      "aria-controls": listId,
      "aria-activedescendant":
        results.length > 0 ? `${baseId}-option-${activeIndex}` : undefined,
      "aria-autocomplete": "list",
      "aria-label": label,
      autoComplete: "off",
      spellCheck: false,
    }),
    [query, handleKeyDown, listId, baseId, activeIndex, results.length],
  );

  const getListProps = useCallback(
    (label = "Commands"): PaletteListProps => ({
      id: listId,
      role: "listbox",
      "aria-label": label,
    }),
    [listId],
  );

  const getItemProps = useCallback(
    (index: number): PaletteItemProps => {
      const item = results[index];
      return {
        id: `${baseId}-option-${index}`,
        role: "option",
        "aria-selected": index === activeIndex,
        "aria-disabled": item?.disabled ? true : undefined,
        tabIndex: -1,
        onMouseMove: () => setActiveIndex(index),
        onClick: () => select(index),
      };
    },
    [results, baseId, activeIndex, select],
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    activeIndex,
    setActiveIndex,
    move,
    select,
    getRootProps,
    getInputProps,
    getListProps,
    getItemProps,
  };
}
