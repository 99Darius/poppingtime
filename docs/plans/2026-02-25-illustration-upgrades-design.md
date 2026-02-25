# Illustration & PDF Generation Upgrades Design

## 1. Character Consistency: Master Reference Image (Option 1A)

**Problem:** Generating illustrations purely from text descriptions causes the AI to wildly vary facial features, specific clothing cuts, and art style nuances across different chapters.

**Solution: The "Character Reference Image" Injection**
Instead of just sending text, we will generate a definitive "Master Reference Image" once, and feed that image as an input along with the text prompt for all subsequent chapter generation calls.

**Architecture:**
1.  **Reference Generation:** Before generating chapter images, we do a single generation call to create the `master_reference_image`. 
    *   Prompt: "Create a character design reference sheet for the following character: [Character Bible]. Simple white background."
2.  **Storage:** Save this image buffer temporarily during the generation process.
3.  **Injection:** For every chapter illustration, we change the Gemini `generateContent` call to include *two* parts in the `contents` array:
    *   `inlineData`: The base64 `master_reference_image`.
    *   `text`: The prompt ("Use the attached image as an EXACT visual reference for the characters in this scene... [Scene Description]").
4.  **Fallback:** If the API rejects the image input (some preview models lock down multimodal inputs for image generation), we gracefully fall back to the pure text-based reference.

## 2. Text Overlay: Smart Placement & Gradients (Option 2A & 2C)

**Problem:** Text overlays arbitrarily block important parts of the image, and solid/semi-solid boxes feel harsh.

**Solution: Image Analysis for "Quiet Zones" + Soft Gradients**
We will stop guessing where the "safe zone" is, and dynamically analyze the returned image to find the best spot for text, then blend it smoothly.

**Architecture:**
1.  **Stop Forcing Blank Space:** Remove the strict "Leave the top 20% blank" prompts. Let the AI draw the best possible full composition.
2.  **Smart Image Analysis (2A):**
    *   When the image buffer returns from Gemini, process it using the `sharp` library (already installed).
    *   Extract the Top 30% and Bottom 30% of the image.
    *   Calculate the **variance/entropy** (busyness) or edge-detection density of both slices. The slice with *lower* variance is the "quiet zone" (e.g., sky vs. complex grass/crowd).
    *   Pass this dynamic `placement` ('top' or 'bottom') to the PDF generator, overriding the original pagination guess.
3.  **Faded Gradient Overlay (2C):**
    *   Instead of drawing a rounded rectangle for the text background in `generate.ts`, we will construct a smooth linear gradient.
    *   Using `pdf-lib`, if the placement is "bottom", we draw a gradient that starts opaque white `#FFFFFF` at `y=0` (bottom edge) and fades to fully transparent `rgba(255,255,255,0)` at `y=250` (top of the text zone).
    *   If "top", we invert the gradient (opaque at the top edge, fading downward).
    *   This ensures the text is perfectly readable along the edge, but gracefully melts into the illustration without harsh box lines.

## Summary of Changes
*   **`lib/ai/illustrate.ts`**: Extract Master Reference Image generation; update chapter generation to accept multimodal (image + text) inputs.
*   **`app/api/illustrate/generate/route.ts`**: Orchestrate the generation of the master reference, pass it downward; analyze `sharp` entropy on returned buffers to determine optimal text placement before passing to `pdf-lib`.
*   **`lib/pdf/generate.ts`**: Replace `page.drawRectangle` under the text with a custom soft gradient mask mechanism.
