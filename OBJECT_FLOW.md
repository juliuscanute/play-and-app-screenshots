# Object Addition Flow Explanation

This document explains the flow of adding a Circle and a Phone Frame to the canvas, detailing how the UI, State Store, and Canvas implementation interact.

## 1. User Interaction (Sidebar.tsx)
The process begins when a user clicks a button in the `Sidebar`.

*   **Circle**:
    *   `Sidebar` imports `addObject` from `useCanvasStore`.
    *   On click, it creates a new object with `type: 'circle'`, a unique UUID, dimensions, and color.
    *   It calls `addObject(newCircleObject)`.

*   **Phone Frame**:
    *   Similar to the circle, but the object has `type: 'device_frame'`.
    *   It includes specific properties: `deviceModel` (e.g., 'iphone_16_pro') and `frameColor`.

## 2. State Update (canvas-store.ts)
The `addObject` action is dispatched to the Zustand store.

*   **Action**: `addObject` accepts the new `CanvasObject`.
*   **State Change**: It appends this new object to the `objects` array in the store.
*   **Re-render**: Any component subscribing to `objects` (like `FabricCanvas`) is notified of the change.

## 3. Canvas Synchronization (FabricCanvas.tsx)
The `FabricCanvas` component has a `useEffect` hook that listens for changes in `objects`.

*   **Detection**: It detects that the `objects` array has changed.
*   **Object Creation (`createFabricObject`)**:
    *   It iterates through the sorted list of objects.
    *   If it finds a new object (by ID) that doesn't exist on the Fabric canvas yet, it calls `createFabricObject`.
*   **Rendering**:
    *   **Circle**: `createFabricObject` simply converts the store object into a `new fabric.Circle()` instance.
    *   **Phone Frame**:
        *   It calls `getDeviceFrameSVG(deviceModel)` to get the SVG string.
        *   It uses `fabric.loadSVGFromString` to parse the SVG.
        *   It creates a `fabric.Group` containing the frame (and optionally a screenshot image).
        *   It calculates complex scaling to toggle between the SVG's native size and the target size in the store.
*   **Addition**: The newly created Fabric object is added to the valid `fabricCanvas` instance (`canvas.add(fabricObj)`).

## 4. Feedback Loop
*   Once added to the Fabric canvas, if the user interacts with it (moves/rotates), `FabricCanvas` listens to `object:modified` events.
*   These events trigger `updateObject` in the store, keeping the store in sync with the visual canvas.

## Visual Summary
`[Button Click] -> [Store Update] -> [useEffect] -> [Fabric Object Creation] -> [Canvas Render]`
