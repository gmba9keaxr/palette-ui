import { createContext, forwardRef, useContext } from "react";
import type {
  ForwardedRef,
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import { useCommandPalette } from "./useCommandPalette.js";
import type { CommandPaletteApi, UseCommandPaletteOptions } from "./useCommandPalette.js";

const PaletteContext = createContext<CommandPaletteApi | null>(null);

export function usePaletteContext(component = "Part"): CommandPaletteApi {
  const api = useContext(PaletteContext);
  if (!api) {
    throw new Error(`<${component}> must be rendered inside <CommandPalette.Root>`);
  }
  return api;
}

const usePalette = usePaletteContext;

function mergeRefs<T>(...refs: Array<Ref<T> | ForwardedRef<T>>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else {
        // RefObject.current is typed readonly but React mutates it on attach.
        const mutable: { current: T | null } = ref;
        mutable.current = node;
      }
    }
  };
}

type RootProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "role" | "aria-modal" | "aria-label" | "onSelect"
> &
  UseCommandPaletteOptions & {
    label?: string;
    children: ReactNode | ((api: CommandPaletteApi) => ReactNode);
  };

/**
 * Renders nothing while closed and a `role="dialog"` wrapper while open.
 * Unstyled on purpose: bring your own classes.
 */
const Root = forwardRef<HTMLDivElement, RootProps>(function CommandPaletteRoot(
  { items, onSelect, filter, maxResults, initialOpen, label, children, className, ...rest },
  forwarded,
) {
  const api = useCommandPalette({ items, onSelect, filter, maxResults, initialOpen });
  if (!api.isOpen) return null;

  return (
    <PaletteContext.Provider value={api}>
      <div
        {...rest}
        {...api.getRootProps(label)}
        ref={forwarded}
        className={className}
        data-state="open"
      >
        {typeof children === "function" ? children(api) : children}
      </div>
    </PaletteContext.Provider>
  );
});

type InputProps = Omit<
  HTMLAttributes<HTMLInputElement>,
  "role" | "type" | "value" | "aria-expanded" | "aria-controls" | "aria-autocomplete"
> & { label?: string };

/**
 * The combobox. It keeps DOM focus, so options stay unfocusable and the
 * active option is announced through `aria-activedescendant`.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function CommandPaletteInput(
  { label, className, ...rest },
  forwarded,
) {
  const api = usePalette("CommandPalette.Input");
  const inputProps = api.getInputProps(label);
  const { ref, onChange, onKeyDown, ...elementProps } = inputProps;

  return (
    <input
      {...rest}
      {...elementProps}
      ref={mergeRefs(ref, forwarded)}
      onChange={onChange}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
});

type ListProps = Omit<HTMLAttributes<HTMLUListElement>, "role" | "id"> & {
  label?: string;
};

const List = forwardRef<HTMLUListElement, ListProps>(function CommandPaletteList(
  { label, className, ...rest },
  forwarded,
) {
  const api = usePalette("CommandPalette.List");
  const listProps = api.getListProps(label);

  return (
    <ul
      {...rest}
      {...listProps}
      ref={forwarded}
      className={className}
      data-empty={api.results.length === 0 ? "" : undefined}
    />
  );
});

type ItemProps = Omit<
  HTMLAttributes<HTMLLIElement>,
  "id" | "role" | "aria-selected" | "tabIndex" | "onClick"
> & {
  index: number;
  children: ReactNode;
};

const Item = forwardRef<HTMLLIElement, ItemProps>(function CommandPaletteItem(
  { index, children, className, ...rest },
  forwarded,
) {
  const api = usePalette("CommandPalette.Item");
  const itemProps = api.getItemProps(index);

  return (
    <li
      {...rest}
      {...itemProps}
      ref={forwarded}
      className={className}
      data-active={itemProps["aria-selected"] ? "" : undefined}
    >
      {children}
    </li>
  );
});

function Empty({ children }: { children: ReactNode }) {
  const api = usePalette("CommandPalette.Empty");
  if (api.results.length > 0) return null;
  return <div role="status">{children}</div>;
}

export const CommandPalette = { Root, Input, List, Item, Empty };
export type { RootProps, InputProps, ListProps, ItemProps };
