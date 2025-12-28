'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { executeToolCall } from '@/lib/gemini/executor';
import { Loader2, Sparkles, Download, Settings, Moon, Sun, Square, Circle, Type, Smartphone, Tablet, Plus } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { v4 as uuidv4 } from 'uuid';
import PropertyPanel from './PropertyPanel';

export default function Sidebar() {
    const { width, height, background, objects, addObject, setBackground, fabricCanvas, setSize, selectedObjectId, updateObject, removeObject, selectObject } = useCanvasStore();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const selectedObject = objects.find(o => o.id === selectedObjectId);

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
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-xl z-20 font-sans transition-colors duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        AI Design
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Powered by Gemini 2.0</p>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-8">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Magic Edit
                    </label>
                    <textarea
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none bg-gray-50 dark:bg-gray-800 mb-3 text-black dark:text-white placeholder-gray-400"
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

                {/* Insert Tools */}
                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Plus className="w-3 h-3" />
                        Insert
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'rect',
                                    x: width / 2 - 50,
                                    y: height / 2 - 50,
                                    width: 100,
                                    height: 100,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    fill: '#3B82F6',
                                    cornerRadius: 10
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Square className="w-5 h-5 text-blue-500" />
                            <span className="text-xs">Rectangle</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'circle',
                                    x: width / 2 - 50,
                                    y: height / 2 - 50,
                                    width: 100,
                                    height: 100,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    fill: '#EF4444',
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Circle className="w-5 h-5 text-red-500" />
                            <span className="text-xs">Circle</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'text',
                                    x: width / 2 - 100,
                                    y: height / 2 - 20,
                                    width: 200,
                                    height: 40,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    fill: '#000000',
                                    text: 'Detail Text',
                                    fontFamily: 'Inter',
                                    fontSize: 32,
                                    fontWeight: 'bold',
                                    textAlign: 'center'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Type className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-xs">Text</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'device_frame',
                                    x: width / 2 - 216,
                                    y: height / 2 - 466,
                                    width: 433,
                                    height: 932,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    deviceModel: 'iphone_16_pro',
                                    frameColor: 'titanium'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Smartphone className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                            <span className="text-xs">iPhone 16</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'device_frame',
                                    x: width / 2 - 206,
                                    y: height / 2 - 457,
                                    width: 412,
                                    height: 915,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    deviceModel: 'pixel_9',
                                    frameColor: 'obsidian'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Smartphone className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                            <span className="text-xs">Pixel 9</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'device_frame',
                                    x: width / 2 - 206,
                                    y: height / 2 - 446,
                                    width: 412,
                                    height: 892,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    deviceModel: 'samsung_s24',
                                    frameColor: 'titanium_gray'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Smartphone className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                            <span className="text-xs">Samsung S24</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'device_frame',
                                    x: width / 2 - 258,
                                    y: height / 2 - 344,
                                    width: 516,
                                    height: 688,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    deviceModel: 'ipad_pro_13',
                                    frameColor: 'space_black'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Tablet className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                            <span className="text-xs">iPad Pro 13"</span>
                        </button>

                        <button
                            onClick={() => {
                                const id = uuidv4();
                                addObject({
                                    id,
                                    type: 'device_frame',
                                    x: width / 2 - 200,
                                    y: height / 2 - 320,
                                    width: 400,
                                    height: 640,
                                    rotation: 0,
                                    opacity: 1,
                                    zIndex: objects.length + 1,
                                    deviceModel: 'android_tablet',
                                    frameColor: 'black'
                                } as any);
                                selectObject(id);
                            }}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center gap-2 transition-colors"
                        >
                            <Tablet className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                            <span className="text-xs">Android Tab</span>
                        </button>
                    </div>
                    {/* End Insert Tools */}
                </div>



                {/* Canvas Size */}
                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        <Settings className="w-3 h-3" />
                        Canvas Size
                    </label>

                    {/* Manual Inputs */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Width</label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setSize(Number(e.target.value), height)}
                                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Height</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setSize(width, Number(e.target.value))}
                                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Android Section */}
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Android (Google Play)
                            </label>
                            <div className="grid grid-cols-1 gap-1.5">
                                <button onClick={() => setSize(1080, 1920)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">Phone Portrait</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">1080 x 1920</div>
                                </button>
                                <button onClick={() => setSize(1200, 1920)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">Tablet 7"</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">1200 x 1920</div>
                                </button>
                                <button onClick={() => setSize(1600, 2560)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">Tablet 10"</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">1600 x 2560</div>
                                </button>
                            </div>
                        </div>

                        {/* iOS Section */}
                        <div>
                            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2 block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                iOS (App Store)
                            </label>
                            <div className="grid grid-cols-1 gap-1.5">
                                <button onClick={() => setSize(1320, 2868)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">iPhone 6.9" (16 Pro Max)</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">1320 x 2868</div>
                                </button>
                                <button onClick={() => setSize(1242, 2688)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">iPhone 6.5" (11 Pro Max)</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">1242 x 2688</div>
                                </button>
                                <button onClick={() => setSize(2064, 2752)} className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-100 dark:border-gray-700 transition-colors group">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-200">iPad Pro 13" (M4)</div>
                                    <div className="text-[10px] text-gray-400 group-hover:text-gray-500">2064 x 2752</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 block">
                        Actions
                    </label>





                    <button
                        onClick={handleExport}
                        className="w-full py-2 bg-gray-900 dark:bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-900 flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export High-Res PNG
                    </button>
                </div>
            </div>
        </div>
    );
}
