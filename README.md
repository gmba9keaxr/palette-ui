# palette-ui

Headless command palette primitives for React. The hook and components own the
parts that are easy to get wrong — ranking, roving active option, focus
restoration, combobox/listbox ARIA — and ship zero CSS.

**Why another palette?** Most implementations couple keyboard handling to a
specific visual shell. `palette-ui` gives you the state machine and the roles,
then leaves markup, styling and motion to your design system. If you need a
dialog shell, mount the root inside your own modal; it does not trap focus or
render a backdrop.

## Install

```sh
npm install palette-ui react
```

Requires React 18+ and TypeScript 5+ for the types.

## Usage

```tsx
import { CommandPalette, useCommandPalette, type PaletteItem } from "palette-ui";
import { useState } from "react";

const actions: PaletteItem[] = [
  { id: "new-file", label: "New file", keywords: ["create", "document"] },
  { id: "settings", label: "Preferences", keywords: ["settings", "config"] },
  { id: "sign-out", label: "Sign out" },
];

export function Palette({ onRun }: { onRun: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Commands</button>
      {open && (
        <CommandPalette.Root
          items={actions}
          onSelect={(item) => {
            onRun(item.id);
            setOpen(false);
          }}
          initialOpen
          label="Editor commands"
        >
          {(palette) => (
            <>
              <CommandPalette.Input placeholder="Search commands" />
              <CommandPalette.List>
                {palette.results.map((item, index) => (
                  <CommandPalette.Item key={item.id} index={index}>
                    {item.label}
                  </CommandPalette.Item>
                ))}
              </CommandPalette.List>
              <CommandPalette.Empty>No matching command.</CommandPalette.Empty>
            </>
          )}
        </CommandPalette.Root>
      )}
    </>
  );
}
```

Want complete control over markup? Skip the components and use the hook:

```ts
const palette = useCommandPalette({
  items: actions,
  onSelect: (item) => run(item.id),
  maxResults: 20,
});
```

Inside a render-prop child, `palette.results` is the ranked array — map over
it, and pass each item's index to `CommandPalette.Item`. Outside the compound
API, spread `palette.getRootProps()`, `palette.getInputProps()`,
`palette.getListProps()` and `palette.getItemProps(index)` onto your own
elements, and render `palette.results`.

### Filtering

The default ranker requires every query token to appear in the label or
keywords, prefers matches at word boundaries, and breaks ties alphabetically.
Replace it when your data lives on a server:

```ts
useCommandPalette({
  items,
  onSelect: run,
  filter: (item, query) => item.label.toLowerCase().includes(query.toLowerCase()),
});
```

`filter` wins over the built-in ranker but is still subject to `maxResults`.

## Props

### `CommandPalette.Root`

| Prop          | Type                                 | Default            | Notes                                   |
| ------------- | ------------------------------------ | ------------------ | --------------------------------------- |
| `items`       | `PaletteItem[]`                      | —                  | Required. `id` must be stable.          |
| `onSelect`    | `(item: PaletteItem) => void`        | —                  | Required. Fires for enabled items only. |
| `filter`      | `(item, query) => boolean`            | built-in ranker    | Optional replacement.                   |
| `maxResults`  | `number`                             | `50`               | Caps the rendered result list.          |
| `initialOpen` | `boolean`                            | `false`            | The hook's open state starts here.      |
| `label`       | `string`                             | `"Command palette"`| Accessible name of the dialog.          |
| `children`    | `ReactNode \| (api) => ReactNode`    | —                  | Render prop receives live `results`.    |

`PaletteItem`: `{ id: string; label: string; keywords?: string[]; disabled?: boolean }`.

### `CommandPalette.Input`

Combobox. Keeps DOM focus; options never receive it. Accepts normal `<input>`
props plus `label` (default `"Type a command"`). Focus returns to the element
that was active before opening once the palette unmounts.

### `CommandPalette.List` / `CommandPalette.Item`

`List` is a `role="listbox"` `<ul>`; `Item` is an `<option>` with
`aria-selected` plus `data-active` for styling. Pass the item's index in
`results`, not in your source array.

### `CommandPalette.Empty`

Renders a `role="status"` node only while there are no results.

## Keyboard

| Key                    | Behaviour                          |
| ---------------------- | ---------------------------------- |
| `ArrowDown` / `ArrowUp`| Move, wrapping, skipping disabled  |
| `Home` / `End`         | Jump to first / last result        |
| `Enter`                | Select the active result           |
| `Escape`               | Close                              |

## Accessibility notes

- The input is `role="combobox"` with `aria-expanded`, `aria-controls` and
  `aria-activedescendant`; options are exposed as `role="option"`.
- Disabled items set `aria-disabled` and are skipped while arrowing.
- Focus is moved into the input on open and restored on unmount. The root is
  `aria-modal="true"`, but focus containment is delegated to the surrounding
  dialog so nested palettes keep working.
- `prefers-reduced-motion` is respected by consumers only — there is no
  built-in transition. Animate opacity, not `transform`, if you can.
- Announce result-count changes with your own live region; the `Empty`
  component covers the zero-result case.

## Layout

```
src/
  filter.ts             tokenised ranking, no React
  useCommandPalette.ts  state machine, focus and ARIA props
  Palette.tsx           compound components over the hook
  index.ts              public exports
```

## License

MIT © 2026 Sofia Okafor
