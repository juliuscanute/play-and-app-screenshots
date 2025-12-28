# State Flow Visualization

This diagram illustrates the precise flow when `addObject` is called, showing how data moves from the UI component through the Zustand store and triggers updates in the Canvas component.

```mermaid
sequenceDiagram
    participant UI as Sidebar Component
    participant Store as Zustand Store (canvas-store.ts)
    participant Canvas as FabricCanvas Component
    participant Fabric as Fabric.js Instance

    Note over UI: User clicks "Add Circle" button
    
    UI->>Store: calls addObject({ type: 'circle', ... })
    activate Store
    
    Note over Store: 1. State Update
    Store->>Store: objects = [...oldObjects, newObject]
    
    Note over Store: 2. Notification
    Store-->>Canvas: Triggers re-render (hook subscription)
    deactivate Store
    
    activate Canvas
    Note over Canvas: 3. Effect Execution
    Canvas->>Canvas: useEffect([objects]) runs
    
    loop For each new object
        Canvas->>Fabric: canvas.add(new fabric.Circle(...))
        activate Fabric
        Fabric-->>Canvas: object instance created
        deactivate Fabric
    end
    
    Canvas->>Fabric: canvas.requestRenderAll()
    deactivate Canvas
```

## detailed Steps

1.  **Direct Call**: The `Sidebar` component directly imports and calls the `addObject` function exposed by the `useCanvasStore` hook.
2.  **Immutability**: Inside `canvas-store.ts`, the `set` function is used. Crucially, it creates a *new array* (`[...state.objects, object]`) rather than mutating the existing one. This is what signals to React that "something changed".
3.  **Subscription**: `FabricCanvas.tsx` calls `const { objects } = useCanvasStore()`. This creates a subscription. When the `objects` reference changes in the store, React forces `FabricCanvas` to re-render.
4.  **Reaction**: The `useEffect` inside `FabricCanvas` has `[objects]` as a dependency, so it runs immediately after the re-render, synchronizing the visual canvas with the new state.
