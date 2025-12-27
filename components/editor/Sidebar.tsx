'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { executeToolCall } from '@/lib/gemini/executor';
import { Loader2, Sparkles, Download, Palette, Settings } from 'lucide-react';

export default function Sidebar() {
    const { width, height, background, objects, addObject, setBackground, fabricCanvas, setSize } = useCanvasStore();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const getStoreProxy = () => ({
        width, height, background, objects, id: 'current',
        setId: () => { },
        setSize: () => { },
        setBackground,
        addObject,
        updateObject: () => { },
        removeObject: () => { },
        setObjects: () => { },
        resetCanvas: () => { }
    });

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);

        try {
            const canvasState = { width, height, background, objects };
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, canvasState }),
            });

            const data = await res.json();
            if (data.toolCalls) {
                data.toolCalls.forEach((call: any) => {
                    executeToolCall(call.name, call.args, getStoreProxy() as any);
                });
            }
        } catch (error) {
            console.error("Generation failed", error);
            alert("Failed to generate.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePreset = (preset: string) => {
        const proxy = getStoreProxy() as any;
        if (preset === 'dark_mode') {
            executeToolCall('set_background', { type: 'solid', colors: ['#121212'] }, proxy);
            executeToolCall('add_decorative_shape', { shape: 'circle', position: 'top_left', color: '#1E1E1E', size: 'large' }, proxy);
        } else if (preset === 'vibrant') {
            executeToolCall('set_background', { type: 'solid', colors: ['#FF5733'] }, proxy); // Fallback until gradients
            executeToolCall('add_decorative_shape', { shape: 'circle', position: 'bottom_right', color: '#C70039', size: 'medium' }, proxy);
        }
    };

    const handleExport = () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            multiplier: 1,
            quality: 1
        });

        const link = document.createElement('a');
        link.download = 'screenshot.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-20 font-sans">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Design Studio
                </h1>
                <p className="text-xs text-gray-400 mt-1">Powered by Gemini 2.0 Flash</p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-8">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Magic Edit
                    </label>
                    <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none bg-gray-50 mb-3 text-black placeholder-gray-400"
                        rows={4}
                        placeholder="e.g. 'Add a blue circle in the top right'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isGenerating}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Designing...
                            </>
                        ) : (
                            "Generate"
                        )}
                    </button>
                </div>

                {/* Presets */}
                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Palette className="w-3 h-3" />
                        Style Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handlePreset('dark_mode')} className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-xs text-gray-700 text-left">
                            🌑 Dark Mode
                        </button>
                        <button onClick={() => handlePreset('vibrant')} className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-xs text-gray-700 text-left">
                            🔥 Vibrant
                        </button>
                    </div>
                </div>

                {/* Canvas Settings */}
                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Settings className="w-3 h-3" />
                        Canvas Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Width</label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setSize(Number(e.target.value), height)}
                                className="w-full p-2 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Height</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setSize(width, Number(e.target.value))}
                                className="w-full p-2 border border-gray-200 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => setSize(1080, 1920)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 truncate" title="Google Play Phone Portrait">
                            📱 Phone (P)
                        </button>
                        <button onClick={() => setSize(1920, 1080)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 truncate" title="Google Play Phone Landscape">
                            📱 Phone (L)
                        </button>
                        <button onClick={() => setSize(1200, 1920)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 truncate" title="Google Play Tablet 7in">
                            💻 Tablet 7"
                        </button>
                        <button onClick={() => setSize(1600, 2560)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-200 truncate" title="Google Play Tablet 10in">
                            💻 Tablet 10"
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block">
                        Actions
                    </label>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manage Objects</label>
                        <button
                            onClick={() => {
                                if (!fabricCanvas) return;
                                const activeObj = fabricCanvas.getActiveObject();
                                if (activeObj) {
                                    // Remove from Store (which syncs to canvas)
                                    // The ID is attached to the fabric object
                                    const id = (activeObj as any).id;
                                    if (id) {
                                        useCanvasStore.getState().removeObject(id);
                                        fabricCanvas.discardActiveObject();
                                        fabricCanvas.requestRenderAll();
                                    }
                                } else {
                                    alert("Please select an object to delete.");
                                }
                            }}
                            className="w-full py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2 mb-2"
                        >
                            Trash Selected
                        </button>
                    </div>

                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Screenshot</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const url = URL.createObjectURL(file);

                                // Find or Create Device
                                const updateDeviceSize = (deviceId: string, currentWidth: number) => {
                                    const img = new Image();
                                    img.onload = () => {
                                        const aspect = img.naturalWidth / img.naturalHeight;
                                        // Pixel 10 SVG has ~20px padding (stroke width 10 on each side)
                                        // If we want the *Internal Image* to be aspect-correct, we need to match the internal dimensions.
                                        // However, the "Device Frame" width in store allows for the whole object.

                                        // Simple Bezel assumption:
                                        const bezelX = 40; // Approx 20px each side safe buffer
                                        const bezelY = 40;

                                        // internalWidth = currentWidth - bezelX;
                                        // targetInternalHeight = internalWidth / aspect;
                                        // newHeight = targetInternalHeight + bezelY;

                                        // Simplified: Just match aspect ratio on the whole frame for robustness
                                        // If we want exact, we'd need to know exact SVG internal metrics.
                                        const newHeight = currentWidth / aspect;

                                        useCanvasStore.getState().updateObject(deviceId, {
                                            screenshotImageId: url,
                                            height: newHeight
                                        } as any);
                                    };
                                    img.src = url;
                                };

                                const device = objects.find(o => o.type === 'device_frame');
                                if (device) {
                                    updateDeviceSize(device.id, device.width);
                                } else {
                                    // Create new
                                    executeToolCall('configure_device', {}, useCanvasStore.getState() as any);
                                    // Then update it
                                    setTimeout(() => {
                                        const newDevice = useCanvasStore.getState().objects.find(o => o.type === 'device_frame');
                                        if (newDevice) {
                                            updateDeviceSize(newDevice.id, newDevice.width);
                                        }
                                    }, 100);
                                }
                            }}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                            "
                        />
                    </div>

                    <button
                        onClick={handleExport}
                        className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export High-Res PNG
                    </button>
                </div>
            </div>
        </div>
    );
}
