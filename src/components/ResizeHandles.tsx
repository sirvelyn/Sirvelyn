import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

// Thin invisible edge/corner handles so the borderless window stays resizable.
const handles = [
  ["n", "North"],
  ["s", "South"],
  ["e", "East"],
  ["w", "West"],
  ["ne", "NorthEast"],
  ["nw", "NorthWest"],
  ["se", "SouthEast"],
  ["sw", "SouthWest"],
] as const;

export function ResizeHandles() {
  return (
    <>
      {handles.map(([cls, dir]) => (
        <div
          key={cls}
          className={`rz rz-${cls}`}
          onMouseDown={(e) => {
            e.preventDefault();
            void appWindow.startResizeDragging(dir as never);
          }}
        />
      ))}
    </>
  );
}
