import { GoogleGenerativeAI } from '@google/generative-ai';
import { tools } from '@/lib/gemini/tools';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    try {
        const { prompt, canvasState, image } = await req.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview", // Or the latest available flash model
            tools: [{ functionDeclarations: tools }],
        });

        const systemPrompt = `
      You are an expert AI UI Designer for App Store Screenshots.
      The canvas size is ${canvasState.width}x${canvasState.height}.
      Your goal is to modify the canvas based on the user's request.
      If an image is provided, analyze the current visual state to improve aesthetics (colors, layout, typography).
      Do not ask for clarification, just make the best design choice.
      Use the available tools. You can call multiple tools in one turn.
      Ensure high contrast.
    `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Understood. I am ready to design." }] }
            ]
        });

        const parts: any[] = [{ text: prompt }];
        if (image) {
            // Remove data:image/png;base64, prefix if present
            const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
            parts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            });
        }

        const result = await chat.sendMessage(parts);
        const response = await result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls) {
            return NextResponse.json({ toolCalls: functionCalls });
        } else {
            // If no tools called, maybe it just chatted?
            return NextResponse.json({ toolCalls: [], message: response.text() });
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: 'Failed to generate design' }, { status: 500 });
    }
}
