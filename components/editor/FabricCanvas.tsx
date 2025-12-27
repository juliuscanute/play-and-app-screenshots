'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '@/store/canvas-store';
import { CanvasObject } from '@/types/canvas';
import { getDeviceFrameSVG } from '@/components/assets/frames';

// Async Helper to map Store Objects to Fabric Objects
const createFabricObject = async (obj: CanvasObject): Promise<fabric.Object | null> => {
    const commonProps = {
        id: obj.id,
        left: obj.x,
        top: obj.y,
        width: obj.width,
        height: obj.height,
        angle: obj.rotation,
        opacity: obj.opacity,
    };

    if (obj.type === 'rect') {
        return new fabric.Rect({
            ...commonProps,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
            rx: (obj as any).cornerRadius || 0,
            ry: (obj as any).cornerRadius || 0,
        });
    }

    if (obj.type === 'circle') {
        return new fabric.Circle({
            ...commonProps,
            radius: obj.width / 2,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
        });
    }

    if (obj.type === 'text') {
        return new fabric.Textbox((obj as any).text, {
            ...commonProps,
            fontFamily: (obj as any).fontFamily,
            fontSize: (obj as any).fontSize,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
            textAlign: (obj as any).textAlign
        });
    }

    if (obj.type === 'path' && (obj as any).pathData) {
        // EXCLUDE width/height from props so Fabric calculates them from pathData
        const { width, height, left, top, ...otherProps } = commonProps;

        const path = new fabric.Path((obj as any).pathData, {
            ...otherProps,
            fill: typeof obj.fill === 'string' ? obj.fill : '#000000',
            originX: 'center',
            originY: 'center',
        });

        // 1. Calculate Scale to match target dimensions
        // path.width/height are the NATIVE dimensions of the SVG path
        if (path.width && path.height) {
            const scaleX = obj.width / path.width;
            const scaleY = obj.height / path.height;
            path.set({ scaleX, scaleY });
        }

        // 2. Position correctly
        // We centre the object, so we move it by half its TARGET size
        path.set({
            left: obj.x + obj.width / 2,
            top: obj.y + obj.height / 2
        });

        return path;
    }




    if (obj.type === 'device_frame') {
        const svgString = getDeviceFrameSVG((obj as any).deviceModel);

        return new Promise((resolve) => {
            // 1. Load the Frame (SVG)
            fabric.loadSVGFromString(svgString, (objects, options) => {
                const frameGroup = fabric.util.groupSVGElements(objects, options);

                // 2. Load the Screenshot (Image) if exists
                if ((obj as any).screenshotImageId) {
                    console.log("   [createFabricObject] Loading screenshot image...");
                    fabric.Image.fromURL((obj as any).screenshotImageId, (img) => {
                        if (!img) {
                            console.error("   [createFabricObject] Failed to load image!");
                            // Fallback: Just return frame
                            frameGroup.set({
                                ...commonProps,
                                scaleX: obj.width / (frameGroup.width || 1),
                                scaleY: obj.height / (frameGroup.height || 1),
                            });
                            // Attach metadata
                            (frameGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                            (frameGroup as any).deviceModel = (obj as any).deviceModel;
                            resolve(frameGroup);
                            return;
                        }

                        console.log("   [createFabricObject] Image loaded:", img.width, img.height);
                        console.log("   [createFabricObject] Frame Group Dim:", frameGroup.width, frameGroup.height);
                        console.log("   [createFabricObject] Frame Scale:", frameGroup.scaleX, frameGroup.scaleY);

                        // Scale image to fit *inside* the frame
                        // Logic: FORCE FILL (Stretch) with BLEED
                        // We use a slightly smaller padding (18 instead of 20) to lets the image 
                        // bleed 1px under the bezel on each side, preventing anti-aliasing gaps.

                        const screenPadding = 18; // Internal padding inside frame (Was 20)
                        const frameWidth = frameGroup.width || 100;
                        const frameHeight = frameGroup.height || 100;

                        const targetWidth = frameWidth - screenPadding;
                        const targetHeight = frameHeight - screenPadding;

                        // Force Stretch
                        // We reset crop values to ensure full image is used
                        img.cropX = 0;
                        img.cropY = 0;

                        // Fabric Image types sometimes mark width/height as optional
                        // Access natural dimensions safely
                        const element = img.getElement() as HTMLImageElement;
                        const validWidth = element?.naturalWidth || img.width || 100;
                        const validHeight = element?.naturalHeight || img.height || 100;

                        img.width = validWidth;
                        img.height = validHeight;

                        const scaleX = targetWidth / validWidth;
                        const scaleY = targetHeight / validHeight;

                        console.log(`   [Fabric] ForceStretch: Scales(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`);

                        img.scaleX = scaleX;
                        img.scaleY = scaleY;

                        // Align image to center of frame
                        img.set({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0
                        });
                        frameGroup.set({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0
                        });

                        // Clip the image to rounded corners
                        // Reduced radius to 32 to match the inner bezel curve (36 - 5 = 31)
                        // If it's too large (40), it cuts the corner too early, leaving a gap.
                        const clipRect = new fabric.Rect({
                            width: targetWidth,
                            height: targetHeight,
                            rx: 32,
                            ry: 32,
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0,
                            absolutePositioned: false
                        });

                        // Scale the clipRect inversely so it looks correct even if image is stretched
                        // Wait, if image is stretched non-uniformly, we need to inverse scale non-uniformly.

                        clipRect.scaleX = 1 / scaleX;
                        clipRect.scaleY = 1 / scaleY;

                        img.clipPath = clipRect;

                        // Create Master Group
                        // We stack: [Image, Frame]
                        const masterGroup = new fabric.Group([img, frameGroup], {
                            ...commonProps,
                            width: frameGroup.width, // Set explicit dimensions for group
                            height: frameGroup.height,
                            scaleX: obj.width / frameWidth,
                            scaleY: obj.height / (frameGroup.height || 1),
                        });

                        // Attach metadata 
                        (masterGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                        (masterGroup as any).deviceModel = (obj as any).deviceModel;

                        resolve(masterGroup);
                    });
                } else {
                    // No image, just frame
                    // We also center-align the frameGroup to be consistent
                    frameGroup.set({
                        originX: 'center',
                        originY: 'center',
                    });

                    frameGroup.set({
                        ...commonProps,
                        scaleX: obj.width / (frameGroup.width || 1),
                        scaleY: obj.height / (frameGroup.height || 1),
                    });

                    // Attach metadata
                    (frameGroup as any).screenshotImageId = (obj as any).screenshotImageId;
                    (frameGroup as any).deviceModel = (obj as any).deviceModel;

                    resolve(frameGroup);
                }
            });
        });
    }

    return null;
};

export default function FabricCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { width, height, background, objects, updateObject, setFabricCanvas } = useCanvasStore();

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || fabricRef.current) return;

        console.log("Initializing Fabric Canvas");
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: width,
            height: height,
            backgroundColor: typeof background === 'string' ? background : '#ffffff',
            preserveObjectStacking: true,
            selection: true,
        });

        fabricRef.current = canvas;
        setFabricCanvas(canvas); // Register with store

        canvas.on('object:modified', (e: any) => {
            const target = e.target;
            if (!target) return;

            updateObject(target.id, {
                x: target.left,
                y: target.top,
                width: target.width! * target.scaleX!,
                height: target.height! * target.scaleY!,
                rotation: target.angle,
                opacity: target.opacity,
            });
        });

        // Keyboard Events
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            const target = e.target as HTMLElement;

            // Ignore if user is typing in an input or textarea
            if (target && (target.nodeName === 'INPUT' || target.nodeName === 'TEXTAREA')) {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObj = canvas.getActiveObject();
                if (activeObj) {
                    const id = (activeObj as any).id;
                    if (id) {
                        useCanvasStore.getState().removeObject(id);
                        canvas.discardActiveObject();
                        canvas.requestRenderAll();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            console.log("Disposing Fabric Canvas");
            window.removeEventListener('keydown', handleKeyDown);
            canvas.dispose();
            fabricRef.current = null;
            setFabricCanvas(null);
        };
    }, []);

    // Sync Store -> Canvas
    useEffect(() => {
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
            // Sort objects by zIndex (ascending) to ensure correct layering
            // Objects with higher zIndex will be processed/added later, appearing on top
            // Note: Fabric's internal list determines draw order.

            const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            const incomingIds = new Set(objects.map(o => o.id));

            // 1. Remove deleted objects
            currentObjects.forEach((obj: any) => {
                if (!incomingIds.has(obj.id)) {
                    canvas.remove(obj);
                }
            });

            // 2. Add/Update objects
            // We iterate through the SORTED list.
            for (const obj of sortedObjects) {
                const exists = currentObjects.find((o: any) => o.id === obj.id);
                if (!exists) {
                    const fabricObj = await createFabricObject(obj);
                    if (fabricObj) {
                        (fabricObj as any).id = obj.id;
                        canvas.add(fabricObj);
                        // Ensure it's in the correct stack position relative to others?
                        // canvas.add puts it at the top.
                        // Since we iterate sortedObjects from low to high zIndex, 
                        // simple adding logically builds the stack correctly from bottom to top.
                        // However, for existing objects, we might need to verify order.
                        fabricObj.moveTo(sortedObjects.indexOf(obj));
                    }
                } else {
                    // Start of Update Logic...
                    // Ensure stacking order for existing objects too
                    exists.moveTo(sortedObjects.indexOf(obj));

                    // Update Logic
                    // For device frames, if the screenshot changed, we need to fully re-create the group
                    if (obj.type === 'device_frame') {
                        // Check if we need to re-render (e.g. screenshot changed or generic update)
                        // We check if the screenshotImageId or deviceModel has changed.
                        // We attach these as custom properties to the Fabric object for comparison.
                        const fabricObj = exists as any;
                        const currentScreenshotId = fabricObj.screenshotImageId;
                        const currentDeviceModel = fabricObj.deviceModel;

                        if (currentScreenshotId !== (obj as any).screenshotImageId || currentDeviceModel !== (obj as any).deviceModel) {
                            const frameGroup = exists;
                            canvas.remove(frameGroup);

                            const newFabricObj = await createFabricObject(obj);
                            if (newFabricObj) {
                                (newFabricObj as any).id = obj.id;
                                (newFabricObj as any).screenshotImageId = (obj as any).screenshotImageId;
                                (newFabricObj as any).deviceModel = (obj as any).deviceModel;

                                canvas.add(newFabricObj);
                                newFabricObj.moveTo(sortedObjects.indexOf(obj));
                            }
                        } else {
                            // Just update position/scale/rotation
                            // IMPORTANT: For Groups (device frames), we must set scaleX/scaleY, NOT width/height.
                            // setting width/height directly on a group changes the bounding box without scaling children, leading to clipping/disappearing.

                            const newScaleX = obj.width / (exists.width || 1);
                            const newScaleY = obj.height / (exists.height || 1);

                            exists.set({
                                left: obj.x,
                                top: obj.y,
                                scaleX: newScaleX,
                                scaleY: newScaleY,
                                angle: obj.rotation,
                                opacity: obj.opacity,
                                // fill: ... frames generally don't use fill in this way, handled by SVG
                            });
                            exists.setCoords(); // Critical for groups after update
                        }
                    } else {
                        // For other objects (rect, text), we can just set props
                        exists.set({
                            left: obj.x,
                            top: obj.y,
                            width: obj.width,
                            height: obj.height,
                            angle: obj.rotation,
                            opacity: obj.opacity,
                            fill: typeof (obj as any).fill === 'string' ? (obj as any).fill : exists.fill
                        });
                        exists.setCoords(); // Critical for groups after updates if needed

                        // Handle interactions or specific text updates if needed
                        if (obj.type === 'text' && exists instanceof fabric.Textbox) {
                            exists.set('text', (obj as any).text);
                        }
                    }
                }
            }

            canvas.requestRenderAll();
        };

        syncObjects();

    }, [width, height, background, objects]);

    // Viewport Scaling & Zoom
    const [zoom, setZoom] = useState(1);

    // Auto-fit on load/resize
    useEffect(() => {
        if (!containerRef.current) return;
        const fitZoom = () => {
            const containerWidth = containerRef.current!.clientWidth - 80;
            const containerHeight = containerRef.current!.clientHeight - 80;
            const scaleX = containerWidth / width;
            const scaleY = containerHeight / height;



            setZoom(Math.min(scaleX, scaleY, 1));
        };

        fitZoom();
        window.addEventListener('resize', fitZoom);
        return () => window.removeEventListener('resize', fitZoom);
    }, [width, height]); // Only re-fit if canvas dimensions change substantially

    // Manual Zoom Handlers
    const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
    const zoomFit = () => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth - 80;
        const containerHeight = containerRef.current.clientHeight - 80;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        setZoom(Math.min(scaleX, scaleY, 1));
    }

    // Keyboard Events - Moved to container level for better focus management
    const handleKeyDown = (e: React.KeyboardEvent) => {
        console.log("Key pressed:", e.key, "Target:", (e.target as HTMLElement).nodeName);

        // Ignore if user is typing in an input or textarea
        // (Though React synthetic events on the div shouldn't trigger if input has focus unless bubbling, 
        // but we want global window-like behavior ONLY when canvas is focused?)
        // Actually, if we use window listener, we have the global issue. 
        // If we use div onKeyDown, we MUST have focus.

        // Let's stick to the window listener for now but DEBUG it.
        // Reverting this specific block change to keeping window listener but adding logs there first.
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-gray-100 relative overflow-hidden flex flex-col outline-none"
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
            <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 z-10">
                <button onClick={zoomOut} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600" title="Zoom Out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </button>
                <span className="text-xs font-mono font-medium text-gray-500 w-12 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button onClick={zoomIn} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600" title="Zoom In">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <button onClick={zoomFit} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600" title="Fit to Screen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                </button>
            </div>
        </div>
    );
}
