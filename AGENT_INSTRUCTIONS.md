# Agent Instructions: Screenshot Generator

This document provides a comprehensive guide for AI agents and developers working on the **Screenshot Generator** codebase. It details the technology stack, project structure, and conventions to ensure consistent and high-quality contributions.

## Project Overview

**App Store Screenshots** is a web application designed to help users create professional-looking screenshots for app store listings. It features a rich canvas editor where users can position device frames, add text, shapes, and customize backgrounds. The application leverages Google's Gemini AI to interpret natural language commands for manipulating the canvas.

## Technology Stack

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
    *   *Definition*: A comprehensive framework built on top of React. While React is the library for building UIs (the "engine"), Next.js provides the full platform (the "car") including routing, data fetching, and server-side rendering necessary for a complete production application.
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
    *   *Definition*: A utility-first CSS framework that allows for rapid UI development by composing low-level utility classes directly in the markup.
    *   *Why Chosen*: It offers exceptional speed of development, enforces a consistent design system, ensures small bundle sizes via unused style purging, and simplifies modern features like dark mode support.
*   **Canvas Library**: [Fabric.js (v5)](http://fabricjs.com/)
    *   *Definition*: A powerful JavaScript library that provides an interactive object model on top of the HTML5 `<canvas>` element.
    *   *Why Chosen*: It abstracts away low-level canvas API calls, providing built-in support for object selection, manipulation (drag, rotate, scale), grouping, and serialization (JSON), which is essential for a rich editor experience.
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Utilities**: `clsx`, `tailwind-merge`, `uuid`, `zod`

## Project Structure

### Root Directory
*   `app/`: Next.js App Router pages and layouts.
    *   `page.tsx`: The main entry point for the editor.
    *   `layout.tsx`: Root layout definition.
    *   `api/`: Backend API routes (if any).
*   `components/`: React components.
    *   `editor/`: Core editor components.
        *   `FabricCanvas.tsx`: Main canvas implementation wrapping Fabric.js.
        *   `PropertyPanel.tsx`: UI for editing properties of selected objects.
        *   `Sidebar.tsx`: Left sidebar for adding elements (shapes, text, devices).
        *   `RightSidebar.tsx`: Right sidebar (often overlaps with PropertyPanel functionality or global settings).
    *   `ui/`: Reusable UI components (buttons, sliders, etc.).
*   `lib/`: Utility libraries and core logic.
    *   `gemini/`: AI integration logic.
        *   `tools.ts`: Definitions of function call tools available to Gemini.
        *   `executor.ts`: Logic to execute the tools returned by Gemini against the `CanvasStore`.
*   `store/`: State management stores.
    *   `canvas-store.ts` (implied): logic for the Zustand store managing the canvas state.
*   `types/`: TypeScript type definitions.
    *   `canvas.ts`: Core types for `CanvasObject`, `CanvasStore`, and specific shape mappings.

## Key Concepts

### Canvas State Management
The application uses a **Zustand** store (`CanvasStore`) to manage the state of the canvas. This avoids direct manipulation of the Fabric.js instance from React components where possible, preferring a reactive state model.

*   **`objects`**: An array of `CanvasObject` representing everything on the canvas.
*   **`width` / `height`**: Dimensions of the canvas.
*   **`background`**: Background color or gradient configuration.

### Object Models (`types/canvas.ts`)
All objects on the canvas extend `BaseObject`:
*   `id`: Unique UUID.
*   `type`: Discriminator (`rect`, `circle`, `text`, `device_frame`, `path`, `image`).
*   **Specialized Types**:
    *   `DeviceFrameObject`: Represents a phone mockup. Contains `deviceModel`, `frameColor`, and optionally a `screenshotImageId`.

### AI Integration (`lib/gemini/`)
The AI feature allows users to type commands like "Add a red circle in the top right".
1.  **Tool Definition** (`tools.ts`): We define tools like `add_decorative_shape`, `configure_device`, `set_background`.
2.  **Tool Execution** (`executor.ts`): The system receives a tool call from Gemini and executes it by calling methods on the `CanvasStore`.
    *   **Convention**: When adding a new capability, you must (1) define the tool schema in `tools.ts` and (2) implement the handler in `executor.ts`.

## Development Conventions

1.  **Functional Components**: Use React Functional Components with Hooks.
2.  **Strict Typing**: Avoid `any`. Use defined types from `types/canvas.ts`.
3.  **Tailwind CSS**: Use utility classes for styling. Avoid CSS modules unless necessary for complex animations not possible with Tailwind.
4.  **Immutability**: When updating the store, ensure state is updated immutably to trigger re-renders correctly.
5.  **AI Prompts**: When modifying AI behavior, keep tool descriptions in `tools.ts` clear and concise as they consume context window tokens.

## Common Tasks

### Adding a New Shape
1.  Update `types/canvas.ts` to include the new shape type in `ShapeType` and create an interface for it.
2.  Update `components/editor/FabricCanvas.tsx` to render the new shape type using Fabric.js.
3.  Update `components/editor/PropertyPanel.tsx` to allow editing properties specific to this shape.
4.  (Optional) Add an AI tool in `lib/gemini/` to allow creating it via natural language.

### Modifying AI Capabilities
1.  Edit `lib/gemini/tools.ts` to add or modify a `FunctionDeclaration`.
2.  Edit `lib/gemini/executor.ts` to handle the new tool name in `executeToolCall`.
