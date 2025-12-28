'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '@/store/canvas-store';
import { CanvasObject, CanvasObjectType } from '@/types/canvas';
import { createFabricObject } from '@/components/editor/utils/fabric-utils';

import { useCanvasZoom } from '@/hooks/useCanvasZoom';

export default function FabricCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);

    const { canvases, activeCanvasId, updateObject, removeObject, copyObject, pasteObject, setFabricCanvas, selectObject } = useCanvasStore();

    // Resolve Active Canvas
    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
    const width = activeCanvas?.width || 1080;
    const height = activeCanvas?.height || 1920;
    const background = activeCanvas?.background || '#ffffff';
    const objects = activeCanvas?.objects || [];


    // Zoom Hook
    const { zoom, containerRef, zoomIn, zoomOut, zoomFit } = useCanvasZoom(width, height);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricRef.current) return;

        console.log("Effect: Initializing Fabric Canvas");
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: width,
            height: height,
            backgroundColor: typeof background === 'string' ? background : '#ffffff',
            preserveObjectStacking: true,
            selection: true,
        });

        fabricRef.current = canvas;
        setFabricCanvas(canvas); // Register with store
        (window as any).fabricCanvas = canvas; // Debugging exposure

        canvas.on('object:modified', (e: any) => {
            const target = e.target;
            if (!target) return;

            console.log("Event: object:modified", { type: target.type, id: (target as any).id });

            if (target.type === 'activeSelection') {
                // Handle Group Selection Modification
                // We need to "bake" the group transform into individual objects to get absolute coords
                const activeSel = target as fabric.ActiveSelection;
                const _objects = activeSel.getObjects();

                // 1. Discard active object to force Fabric to apply group transforms to objects
                // We suppress standard events to verify if that helps, but typically we want to update store.
                // However, we need to restore selection later.
                canvas.discardActiveObject();

                // 2. Iterate and update store
                _objects.forEach((obj: any) => {
                    const id = obj.id;
                    if (!id) return;

                    console.log(`ModGroup: Processing ${obj.type} id=${obj.id} W=${obj.width} Scale=${obj.scaleX}`);

                    // Fabric has now updated obj.left/top/scale/angle to absolute values
                    const updates: Partial<CanvasObject> = {
                        x: obj.left,
                        y: obj.top,
                        rotation: obj.angle,
                        opacity: obj.opacity,
                    };

                    // Handle specific type scaling
                    // Logic mirrored from single-object update, but since we discarded group, 
                    // obj.scaleX/Y are now set correctly relative to canvas.
                    if (obj.type === CanvasObjectType.Text) {
                        const scaleX = obj.scaleX || 1;
                        const scaleY = obj.scaleY || 1;
                        const currentFontSize = (obj as fabric.Textbox).fontSize || 16;
                        const currentWidth = obj.width || 0;
                        (updates as any).fontSize = currentFontSize * scaleY;
                        updates.width = currentWidth * scaleX;
                        // Reset scale in next sync usually, but for now we just save the baked values
                    } else if (obj.deviceModel || obj.type === CanvasObjectType.DeviceFrame) {
                        // DeviceFrame (Group)
                        // Width = Native * Scale
                        updates.width = (obj.width || 0) * (obj.scaleX || 1);
                        updates.height = (obj.height || 0) * (obj.scaleY || 1);
                    } else {
                        // Rect, Image, Circle, Path
                        // We just take width * scale.
                        updates.width = (obj.width || 0) * (obj.scaleX || 1);
                        updates.height = (obj.height || 0) * (obj.scaleY || 1);
                    }

                    updateObject(id, updates);
                });

                // 3. Restore Selection
                // We need to create a new selection because the old one is destroyed/invalidated
                const newSel = new fabric.ActiveSelection(_objects, {
                    canvas: canvas,
                });
                canvas.setActiveObject(newSel);
                canvas.requestRenderAll();
                return;
            }

            const updates: Partial<CanvasObject> = {
                x: target.left,
                y: target.top,
                rotation: target.angle,
                opacity: target.opacity,
            };

            if (target.type === CanvasObjectType.Text) {
                // For Text, we want to scale fontSize, not just width/height
                // Fabric scales the object. We want to bake that scale into fontSize.
                const scaleX = target.scaleX || 1;
                const scaleY = target.scaleY || 1;

                // Current values
                const currentFontSize = (target as fabric.Textbox).fontSize || 16;
                const currentWidth = target.width || 0;

                (updates as any).fontSize = currentFontSize * scaleY;
                updates.width = currentWidth * scaleX;
                // height is auto-calculated by fabric for text usually based on content/fontsize/width
                // but we can track bounding box height
                updates.height = (target.height || 0) * scaleY;

                // We effectively reset scale for next render cycle via store update
            } else if (target.type === CanvasObjectType.Circle) {
                // For circle, we want radius to absorb the scale
                const scaleX = target.scaleX || 1;
                // Assuming uniform scale for circle usually, or we take max
                updates.width = (target.width || 0) * scaleX;
                updates.height = (target.height || 0) * scaleX; // Keep it square/circular-ish logic
            } else if (target.type === CanvasObjectType.DeviceFrame) {
                // Device frames are Groups. We track their bounding box.
                // But typically we want to keep them as "scale" in store?
                // No, our strict sync logic prefers w/h.
                updates.width = (target.width || 0) * (target.scaleX || 1);
                updates.height = (target.height || 0) * (target.scaleY || 1);
            } else {
                // Rects, etc
                updates.width = (target.width || 0) * (target.scaleX || 1);
                updates.height = (target.height || 0) * (target.scaleY || 1);
            }

            updateObject(target.id, updates);
        });

        // ... (selection handlers remain same)
        const handleSelection = (e: any) => {
            const selected = e.selected || (e.target ? [e.target] : []);
            console.log("Event: selection", selected.map((o: any) => ({ id: o.id, type: o.type })));

            if (selected.length > 0) {
                const id = selected[0].id;
                if (id) {
                    selectObject(id);
                } else {
                    console.error("CRITICAL: Selected object missing ID", selected[0]);
                }
            } else {
                selectObject(null);
            }
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);

        canvas.on('selection:cleared', () => {
            console.log("Event: selection:cleared");
            selectObject(null);
        });

        return () => {
            console.log("Disposing Fabric Canvas");
            canvas.dispose();
            fabricRef.current = null;
            setFabricCanvas(null);
            (window as any).fabricCanvas = null;
        };
    }, []);

    // Sync Store -> Canvas
    useEffect(() => {
        console.log("Effect: Sync Store -> Canvas triggered", { width, height, background, objects });
        const canvas = fabricRef.current;
        if (!canvas) return;

        if (canvas.getWidth() !== width || canvas.getHeight() !== height) {
            canvas.setWidth(width);
            canvas.setHeight(height);
        }

        if (typeof background === 'string') {
            canvas.setBackgroundColor(background, canvas.renderAll.bind(canvas));
        }

        const syncObjects = async () => {
            const currentObjects = canvas.getObjects();
            const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

            // 1. Add/Update/Remove logic
            // ... (remove logic same as before, omitted for brevity if unchanged - wait I need to replace block)
            const incomingIds = new Set(objects.map(o => o.id));
            currentObjects.forEach((obj: any) => {
                if (!incomingIds.has(obj.id)) {
                    canvas.remove(obj);
                }
            });

            for (const obj of sortedObjects) {
                console.log("Sync: Processing object", { id: obj.id, type: obj.type, zIndex: obj.zIndex });
                const exists = currentObjects.find((o: any) => o.id === obj.id);
                if (!exists) {
                    console.log("Sync: Creating new object", obj.id, obj.type);
                    const fabricObj = await createFabricObject(obj);
                    if (fabricObj) {
                        (fabricObj as any).id = obj.id;
                        canvas.add(fabricObj);
                        fabricObj.moveTo(sortedObjects.indexOf(obj));
                    }
                } else {
                    exists.moveTo(sortedObjects.indexOf(obj));

                    // CRITCAL UPDATE LOGIC: Reset Scale to 1 when applying dimensions
                    console.log("Sync: Checking update type for", obj.id, obj.type);
                    if (obj.type === CanvasObjectType.DeviceFrame) {
                        const fabricObj = exists as any;
                        console.log(`Sync: [DeviceFrame] id=${obj.id} model=${fabricObj.deviceModel}`);
                        const nativeWidth = exists.width || 1;
                        console.log(`Sync: [DeviceFrame] current: nativeW=${nativeWidth} storeW=${obj.width} calcScale=${obj.width / nativeWidth}`);
                        // DeviceFrame is special (Group). Re-creation logic handled separately or strict update
                        // ... (keep existing creation check logic)

                        if (fabricObj.screenshotImageId !== (obj as any).screenshotImageId || fabricObj.deviceModel !== (obj as any).deviceModel) {
                            console.log("Sync: Re-creating DeviceFrame due to model/image change", obj.id);
                            canvas.remove(exists);
                            const newFabricObj = await createFabricObject(obj);
                            if (newFabricObj) {
                                (newFabricObj as any).id = obj.id;
                                canvas.add(newFabricObj);
                                newFabricObj.moveTo(sortedObjects.indexOf(obj));
                            }
                        } else {
                            console.log("Sync: Updating existing DeviceFrame props", obj.id);
                            // Update existing Frame Group
                            // Group width/height is weird in Fabric. 
                            // Better to use scale for Groups if internal objects are fixed size.
                            // BUT we are normalizing to W/H in store.
                            // Let's rely on calculation:
                            const nativeWidth = exists.width || 1;
                            const nativeHeight = exists.height || 1;
                            exists.set({
                                left: obj.x,
                                top: obj.y,
                                scaleX: obj.width / nativeWidth,
                                scaleY: obj.height / nativeHeight,
                                angle: obj.rotation,
                                opacity: obj.opacity,
                            });
                            exists.setCoords();
                        }
                    } else if (obj.type === CanvasObjectType.Circle && exists instanceof fabric.Circle) {
                        exists.set({
                            radius: obj.width / 2,
                            left: obj.x,
                            top: obj.y,
                            scaleX: 1, // RESET SCALE
                            scaleY: 1, // RESET SCALE
                            angle: obj.rotation,
                            opacity: obj.opacity,
                            fill: typeof obj.fill === 'string' ? obj.fill : '#cccccc'
                        });
                        exists.setCoords();
                    } else if (obj.type === CanvasObjectType.Text && exists instanceof fabric.Textbox) {
                        exists.set({
                            text: (obj as any).text,
                            width: obj.width, // Textbox width (wrapping)
                            fontSize: (obj as any).fontSize, // Actual size
                            left: obj.x,
                            top: obj.y,
                            scaleX: 1, // RESET SCALE
                            scaleY: 1, // RESET SCALE
                            angle: obj.rotation,
                            opacity: obj.opacity,
                            fill: (obj as any).fill,
                            fontFamily: (obj as any).fontFamily,
                            fontWeight: (obj as any).fontWeight || 'normal',
                            fontStyle: (obj as any).fontStyle || 'normal',
                            underline: (obj as any).underline || false,
                            textAlign: (obj as any).textAlign
                        });
                        exists.setCoords();
                    } else if (obj.type === CanvasObjectType.Path) {
                        // Vector Path logic (Fix for shrinking bug)
                        // Paths don't respond to width/height directly in Fabric for scaling.
                        // We must use scaleX/scaleY.
                        // Fabric stores 'width'/'height' as the bounding box of the unscaled path.

                        // NOTE: exists.width is the UN-SCALED width (native).
                        // If we want the object to be 'obj.width' pixels wide, we calculate scale.

                        const nativeWidth = exists.width || 1;
                        const nativeHeight = exists.height || 1;

                        exists.set({
                            left: obj.x,
                            top: obj.y,
                            scaleX: obj.width / nativeWidth,
                            scaleY: obj.height / nativeHeight,
                            angle: obj.rotation,
                            opacity: obj.opacity,
                            fill: typeof (obj as any).fill === 'string' ? (obj as any).fill : exists.fill,
                            stroke: (obj as any).stroke,
                            strokeWidth: (obj as any).strokeWidth
                        });
                        exists.setCoords();
                    } else {
                        console.log("Sync: Updating Generic object (Rect/Image)", obj.id, obj.type);
                        // Rects/Images
                        exists.set({
                            width: obj.width,
                            height: obj.height,
                            left: obj.x,
                            top: obj.y,
                            scaleX: 1, // RESET SCALE
                            scaleY: 1, // RESET SCALE
                            angle: obj.rotation,
                            opacity: obj.opacity,
                            fill: typeof (obj as any).fill === 'string' ? (obj as any).fill : exists.fill
                        });
                        // Specific Rect props
                        if (obj.type === CanvasObjectType.Rect && exists instanceof fabric.Rect) {
                            exists.set({
                                rx: (obj as any).cornerRadius || 0,
                                ry: (obj as any).cornerRadius || 0,
                            })
                        }
                        exists.setCoords();
                    }
                }
            }
            canvas.requestRenderAll();
        };

        syncObjects();
    }, [width, height, background, objects]);

    // Keyboard Events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault();
                copyObject();
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
                e.preventDefault();
                pasteObject();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const canvas = fabricRef.current;
                if (!canvas) return;

                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    // Start removing
                    const id = (activeObject as any).id;
                    if (id) {
                        removeObject(id);
                        // Clear fabric selection immediately to prevent ghosting before next render sync
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [removeObject, copyObject, pasteObject]);


    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-gray-100 dark:bg-gray-950 relative overflow-hidden flex flex-col outline-none transition-colors duration-200"
            tabIndex={0} // Allow div to receive focus
            onClick={() => containerRef.current?.focus()} // Ensure click focuses
        >
            {/* Scrollable Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-10">
                <div
                    style={{
                        width: width * zoom,
                        height: height * zoom,
                        flexShrink: 0, // Prevent flex squishing
                        transition: 'width 0.2s, height 0.2s'
                    }}
                >
                    <div
                        style={{
                            width: width,
                            height: height,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-10">
                <button onClick={zoomOut} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" title="Zoom Out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </button>
                <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 w-12 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button onClick={zoomIn} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" title="Zoom In">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                <button onClick={zoomFit} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400" title="Fit to Screen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                </button>
            </div>
        </div>
    );
}
