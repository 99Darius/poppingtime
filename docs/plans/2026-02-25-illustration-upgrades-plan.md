# Illustration Upgrades Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a Master Character Reference Image system for consistent illustrations, and a Smart Gradient Text Overlay system that dynamically places text in the quietest part of the image.

**Architecture:** We will first generate a reference image from the character bible. We will pass this image as a multimodal input to subsequent Gemini calls. When images return, we will use `sharp` to analyze entropy in the top vs. bottom 30% to choose text placement. Finally, `pdf-lib` will draw a smooth linear gradient overlay instead of a hard box.

**Tech Stack:** Next.js, OpenAI (Character Bible), Google Gemini (Image Gen. with multimodal input), `sharp` (entropy analysis), `pdf-lib` (custom drawing/gradients).

---

### Task 1: Generate Master Reference Image Function

**Files:**
- Modify: `lib/ai/illustrate.ts`

**Step 1: Write the implementation**
Add a new function `generateReferenceImage` that takes the character bible and calls Gemini to create a character sheet.

```typescript
// lib/ai/illustrate.ts
export async function generateReferenceImage(
    characterBible: string,
    imageStyle: string,
    imageModel: string
): Promise<Buffer | null> {
    if (!imageModel.includes('gemini')) return null;

    const prompt = `Art style: ${imageStyle}\n\nCreate a clean character design reference sheet for the following characters on a pure white background. DO NOT add any text or background scenery. Maintain exactly these visual traits:\n\n${characterBible}`;

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

    const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${imageModel}:generateContent?key=\${apiKey}\`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const imagePart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
        if (!imagePart?.inlineData?.data) return null;
        
        return Buffer.from(imagePart.inlineData.data, 'base64');
    } catch (e) {
        console.error("Reference image generation failed, falling back to text-only", e);
        return null; // Graceful fallback
    }
}
```

**Step 2: Commit**
```bash
git add lib/ai/illustrate.ts
git commit -m "feat: add generateReferenceImage function"
```

---

### Task 2: Update generateIllustration to Accept Reference Image

**Files:**
- Modify: `lib/ai/illustrate.ts`

**Step 1: Write the implementation**
Modify `generateIllustration` signature to accept `referenceImageBuffer?: Buffer`. Then update the text prompt (removing top/bottom constraints) and inject the multimodal payload into the fetch call.

```typescript
// Update signature in lib/ai/illustrate.ts
export async function generateIllustration(
    chapterText: string,
    imageStyle: string,
    chapterNumber: number,
    imageModel: string,
    characterBible?: string,
    referenceImageBuffer?: Buffer,
    textPlacement: 'top' | 'bottom' = 'bottom' // keep arg for signature compat, but we will ignore it in prompt
): Promise<Buffer> {
    // ... inside the gemini block ...
    const parts: string[] = []
    parts.push(\`Art style: \${imageStyle}\`)

    if (characterBible) {
        parts.push(\`CHARACTER BIBLE: You MUST follow these exact visual descriptions. DO NOT deviate.\n\${characterBible}\`)
    }
    if (referenceImageBuffer) {
        parts.push(\`REFERENCE IMAGE PROVIDED: You MUST visually match the characters exactly as they appear in the attached reference image.\`)
    }

    parts.push(\`Scene for Chapter \${chapterNumber}: \${sceneText}\`)
    parts.push(\`LAYOUT: Full-page square illustration. Compose the scene naturally. Do NOT include any text, words, letters, or writing in the image.\`)

    const prompt = parts.join('\\n\\n')
    // ...
    
    // Update fetch body
    const contentsParts: any[] = [{ text: prompt }];
    if (referenceImageBuffer) {
        contentsParts.unshift({
            inlineData: {
                data: referenceImageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        });
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: contentsParts }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.4 }
        })
    })
    // ...
```

**Step 2: Commit**
```bash
git add lib/ai/illustrate.ts
git commit -m "feat: support multimodal reference image injection in illustration prompt"
```

---

### Task 3: Implement Image Entropy Analysis for Smart Placement

**Files:**
- Create: `lib/ai/image-analysis.ts`

**Step 1: Write the implementation**
Use `sharp` to analyze an image buffer, returning whether the "top" or "bottom" is quieter (lower standard deviation/entropy).

```typescript
// lib/ai/image-analysis.ts
import sharp from 'sharp';

export async function determineOptimalTextPlacement(imageBuffer: Buffer): Promise<'top' | 'bottom'> {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const height = metadata.height || 1024;
        const width = metadata.width || 1024;
        
        // Analyze top 30%
        const topSlice = await sharp(imageBuffer)
            .extract({ left: 0, top: 0, width: width, height: Math.floor(height * 0.3) })
            .greyscale()
            .stats();
            
        // Analyze bottom 30%
        const bottomSlice = await sharp(imageBuffer)
            .extract({ left: 0, top: Math.floor(height * 0.7), width: width, height: Math.floor(height * 0.3) })
            .greyscale()
            .stats();

        // channels[0].stdev represents the variance (busyness) of the greyscale image
        const topBusyness = topSlice.channels[0].stdev;
        const bottomBusyness = bottomSlice.channels[0].stdev;

        // Place text in the LESS busy slice
        return topBusyness < bottomBusyness ? 'top' : 'bottom';
    } catch (e) {
        console.error("Image analysis failed, defaulting to bottom", e);
        return 'bottom';
    }
}
```

**Step 2: Commit**
```bash
git add lib/ai/image-analysis.ts
git commit -m "feat: smart image entropy analysis for text placement"
```

---

### Task 4: Orchestrate Generation Route

**Files:**
- Modify: `app/api/illustrate/generate/route.ts`

**Step 1: Write the implementation**
Modify the `POST` route to generate the reference image first, pass it to illustration generation, and then analyze the returned images to override `textPlacement`.

```typescript
// In app/api/illustrate/generate/route.ts
// Add imports:
import { generateIllustration, generateCharacterBible, generateReferenceImage } from '@/lib/ai/illustrate'
import { determineOptimalTextPlacement } from '@/lib/ai/image-analysis'

// Under generation of character bible:
let referenceBuffer: Buffer | null = null;
if (characterBible) {
    console.log('Generating master reference image...');
    referenceBuffer = await generateReferenceImage(characterBible, imageStyle, imageModel);
}

// Inside the batch processing loop (around line 120):
                    illustrationBuffer = await generateIllustration(
                        illustrationPrompt,
                        imageStyle,
                        chapterNumber,
                        imageModel,
                        characterBible,
                        referenceBuffer || undefined, // PASS IT HERE
                        textPlacement
                    );
                    
                    let optimalPlacement = textPlacement;
                    if (illustrationBuffer) {
                        optimalPlacement = await determineOptimalTextPlacement(illustrationBuffer);
                    }
                    console.log(\`Finished image for page \${pageIndex}. Optimal text placement: \${optimalPlacement}\`);

                // return { ... optimalPlacement } instead of textPlacement
                return {
                    chapterNumber,
                    content,
                    illustrationBuffer,
                    textPlacement: optimalPlacement 
                };
```

**Step 2: Commit**
```bash
git add app/api/illustrate/generate/route.ts
git commit -m "feat: pipe reference images and smart placement through generation route"
```

---

### Task 5: Implement Soft Gradient in PDF Generator

**Files:**
- Modify: `lib/pdf/generate.ts`

**Step 1: Write the implementation**
Remove the compact right-inset boxes. Write a PDF operator directly to create a soft gradient that spans the full width and extends up from the bottom (or down from the top), fading to transparent.

*Note: pdf-lib does not have native linear gradient drawing methods like `drawGradient`. We must construct a pseudo-gradient by drawing ~50 thin, overlapping transparent rectangles stacking in opacity.*

```typescript
// Replace section 3 (Draw compact rounded-rectangle backdrop) in lib/pdf/generate.ts
        // 3. Draw Soft Gradient Background
        const isTop = chapter.textPlacement === 'top'
        const gradientHeight = boxH + 60 // Extend fade slightly beyond text
        const STEPS = 40;
        const gradientYBase = isTop ? PAGE_SIZE - gradientHeight : 0;
        
        for (let idx = 0; idx < STEPS; idx++) {
            const progress = idx / STEPS;
            // Easing function for smoother fade (quadratic)
            const opacity = 0.95 * Math.pow(1 - progress, 2); 
            
            const stepHeight = gradientHeight / STEPS;
            const yRect = isTop 
                ? PAGE_SIZE - (stepHeight * (idx + 1)) // stepping down from top
                : stepHeight * idx; // stepping up from bottom
            
            page.drawRectangle({
                x: 0,
                y: yRect,
                width: PAGE_SIZE,
                height: stepHeight + 1, // +1 for overlap to prevent seams
                color: rgb(1, 1, 1),
                opacity: opacity
            });
        }
        
        // Remove old boxX and replace with exact center alignment, floating near top/bottom edge
        // In section 4: Draw Text Elements
        // Replace `x: boxX + TEXT_PADDING_X` with `x: PAGE_SIZE / 2 - (widthOfLine / 2)`
        // So text is centered horizontally inside the gradient.
```

**Step 2: Commit**
```bash
git add lib/pdf/generate.ts
git commit -m "feat: replace hard PDF boxes with smooth linear gradients"
```
