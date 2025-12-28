import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export const tools: FunctionDeclaration[] = [
    {
        name: "set_background",
        description: "Sets the background style of the canvas using a solid color or gradient.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING, enum: ["solid", "linear", "radial"], format: "enum" },
                colors: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "Array of hex codes. If gradient, implies equal distribution."
                },
                direction: { type: SchemaType.STRING, enum: ["to_bottom", "to_right", "diagonal_tl_br"], format: "enum" }
            },
            required: ["type", "colors"]
        }
    },
    {
        name: "add_decorative_shape",
        description: "Adds a geometric shape to the canvas to serve as visual interest.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                shape: { type: SchemaType.STRING, enum: ["circle", "rect", "triangle", "polygon"], format: "enum" },
                position: { type: SchemaType.STRING, enum: ["top_left", "top_right", "bottom_left", "bottom_right", "center_behind_phone", "random", "top_center", "bottom_center", "center_left", "center_right"], format: "enum" },
                color: { type: SchemaType.STRING, description: "Hex code or 'accent'." },
                size: { type: SchemaType.STRING, enum: ["small", "medium", "large"], format: "enum" },
                sides: { type: SchemaType.NUMBER, description: "Number of sides for polygon (def 5)" }
            },
            required: ["shape", "position", "color"]
        }
    },
    {
        name: "add_line_arrow",
        description: "Adds a line or arrow for annotation.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING, enum: ["line", "arrow"], format: "enum" },
                startPosition: { type: SchemaType.STRING, enum: ["top_left", "top_right", "bottom_left", "bottom_right", "center"], format: "enum" },
                endPosition: { type: SchemaType.STRING, enum: ["top_right", "bottom_right", "bottom_left", "top_left", "center"], format: "enum" },
                color: { type: SchemaType.STRING, description: "Stroke color" },
                width: { type: SchemaType.NUMBER, description: "Stroke width (def 4)" }
            },
            required: ["type", "startPosition", "endPosition", "color"]
        }
    },
    {
        name: "add_text_overlay",
        description: "Adds a text headline to the screenshot.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                content: { type: SchemaType.STRING, description: "The text string to display" },
                style: { type: SchemaType.STRING, enum: ["title", "subtitle", "caption"], format: "enum" },
                position: { type: SchemaType.STRING, enum: ["top", "bottom", "center"], format: "enum" },
                color: { type: SchemaType.STRING, description: "Hex code for text color" }
            },
            required: ["content", "style", "position"]
        }
    },
    {
        name: "configure_device",
        description: "Adjusts the position, rotation, and 3D tilt of the phone mockup.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                scale: { type: SchemaType.NUMBER, description: "Scale factor (0.5 to 1.5)" },
                rotation: { type: SchemaType.NUMBER, description: "2D rotation in degrees" },
                tiltX: { type: SchemaType.NUMBER, description: "3D tilt on X axis (for perspective)" },
                tiltY: { type: SchemaType.NUMBER, description: "3D tilt on Y axis" },
                y_position: { type: SchemaType.STRING, enum: ["bottom_peeking", "center", "floating"], format: "enum" },
                model: { type: SchemaType.STRING, enum: ["iphone_15_pro", "pixel_10"], format: "enum", description: "Device model frame to use." }
            }
        }
    },
    {
        name: "add_vector_shape",
        description: "Adds a complex vector shape (star, cloud, heart, etc.) using SVG Path data.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                pathData: { type: SchemaType.STRING, description: "SVG Path 'd' attribute string (e.g. 'M 10 10 L 50 10 ...')" },
                name: { type: SchemaType.STRING, description: "Name of the shape for identification (e.g. 'red_star')" },
                color: { type: SchemaType.STRING, description: "Fill color (Hex)" },
                position: { type: SchemaType.STRING, enum: ["top_left", "top_right", "bottom_left", "bottom_right", "center", "random"], format: "enum" },
                scale: { type: SchemaType.NUMBER, description: "Scale multiplier (default 1)" }
            },
            required: ["pathData", "color", "position"]
        }
    },
    {
        name: "update_object",
        description: "Updates properties of an existing object on the canvas.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "The ID of the object to update." },
                updates: {
                    type: SchemaType.OBJECT,
                    description: "Key-value pairs of properties to update.",
                    properties: {
                        fill: { type: SchemaType.STRING, description: "New color/fill" },
                        opacity: { type: SchemaType.NUMBER },
                        x: { type: SchemaType.NUMBER },
                        y: { type: SchemaType.NUMBER },
                        width: { type: SchemaType.NUMBER },
                        height: { type: SchemaType.NUMBER },
                        rotation: { type: SchemaType.NUMBER },
                        text: { type: SchemaType.STRING },
                        fontSize: { type: SchemaType.NUMBER },
                        fontWeight: { type: SchemaType.STRING },
                        zIndex: { type: SchemaType.NUMBER }
                    }
                }
            },
            required: ["id", "updates"]
        }
    }
];
