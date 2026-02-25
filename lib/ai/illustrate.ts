import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Analyze the full story text using AI to produce a Character Bible —
 * a structured description of every recurring character, object, and setting.
 * This bible is then injected into every illustration prompt for visual consistency.
 */
export async function generateCharacterBible(
    chapters: { chapterNumber: number; content: string }[]
): Promise<string> {
    const fullText = chapters.map(ch => `Chapter ${ch.chapterNumber}:\n${ch.content}`).join('\n\n')

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are an expert children's book illustrator assistant. Analyze the story text and produce a CHARACTER BIBLE that will be used to instruct an AI image generation model to maintain visual consistency across all illustrations.

For each recurring character, describe:
- Name
- Age/size (approximate)
- Hair: color, length, style
- Eyes: color, shape
- Skin tone
- Clothing: exact items, colors, patterns
- Accessories: bags, glasses, shoes, hats
- Distinguishing features: scars, freckles, posture

For key recurring objects or settings, describe:
- Exact visual appearance
- Colors, materials, textures
- Any magical or special properties shown visually

CRITICAL ANTI-HALLUCINATION RULE:
- DO NOT invent, assume, or add ANY characters, animals, sidekicks, or pets that are NOT explicitly mentioned in the text.
- If there is no pet, do not list a pet.

Keep descriptions concise but highly specific. Use simple, direct visual language that an image generation model can follow.
Format as a numbered list. Do NOT include any narrative or explanation — only visual descriptions.`
            },
            {
                role: 'user',
                content: `Analyze this children's story and produce a Character Bible:\n\n${fullText.substring(0, 8000)}`
            }
        ],
        temperature: 0.3,
        max_tokens: 1500,
    })

    return response.choices[0]?.message?.content || ''
}

/**
 * Generate a Master Character Reference Image.
 * This creates a single visual source of truth from the Character Bible,
 * which will be injected as an image prompt into all subsequent chapter generation calls.
 */
export async function generateReferenceImage(
    characterBible: string,
    imageStyle: string,
    imageModel: string
): Promise<Buffer | null> {
    if (!imageModel.includes('gemini')) return null;

    const prompt = `Art style: ${imageStyle}\n\nCreate a clean character design reference sheet for the following characters on a pure white background. DO NOT add any text or background scenery. Maintain exactly these visual traits:\n\n${characterBible}`;

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
            })
        });

        if (!response.ok) {
            console.warn(`Reference image generation failed with status ${response.status}`);
            return null;
        }

        const data = await response.json();
        const imagePart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData?.data) {
            console.warn('No image data in Gemini reference image response');
            return null;
        }

        return Buffer.from(imagePart.inlineData.data, 'base64');
    } catch (e) {
        console.error("Reference image execution failed, falling back to text-only", e);
        return null; // Graceful fallback
    }
}

/**
 * Generate a full-page illustration for a single chapter.
 * The prompt is built from: art style + character bible + scene + text-safe-zone instructions.
 */
export async function generateIllustration(
    chapterText: string,
    imageStyle: string,
    chapterNumber: number,
    imageModel: string,
    characterBible?: string,
    referenceImageBuffer?: Buffer,
    textPlacement: 'top' | 'bottom' = 'bottom'
): Promise<Buffer> {
    const sceneText = chapterText.substring(0, 600)

    // ------------------------------------------------------------------------
    // PATH A: Google / Gemini Native Image Generation
    // ------------------------------------------------------------------------
    if (imageModel.includes('gemini')) {
        const parts: string[] = []
        parts.push(`Art style: ${imageStyle}`)

        if (characterBible) {
            parts.push(`CHARACTER BIBLE: You MUST follow these exact visual descriptions. DO NOT deviate.\n${characterBible}`)
        }
        if (referenceImageBuffer) {
            parts.push(`REFERENCE IMAGE PROVIDED: You MUST visually match the characters exactly as they appear in the attached reference image.`)
        }

        parts.push(`Scene for Chapter ${chapterNumber}: ${sceneText}`)
        parts.push(`LAYOUT: Full-page square illustration. Compose the scene naturally. Do NOT include any text, words, letters, or writing in the image.`)

        const prompt = parts.join('\n\n')

        // Gemini native image generation via generateContent API
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
        if (!apiKey) throw new Error('Missing GOOGLE_API_KEY for Gemini Image Generation')

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`

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
                generationConfig: {
                    responseModalities: ['IMAGE', 'TEXT'],
                    temperature: 0.4,
                }
            })
        })

        if (!response.ok) {
            const errBody = await response.text()
            throw new Error(`Gemini Image API Error: ${response.status} - ${errBody}`)
        }

        const data = await response.json()

        const candidates = data?.candidates
        if (!candidates || candidates.length === 0) throw new Error('No candidates in Gemini response')

        const responseParts = candidates[0]?.content?.parts || []
        const imagePart = responseParts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'))

        if (!imagePart?.inlineData?.data) {
            throw new Error('No image data in Gemini generateContent response')
        }

        return Buffer.from(imagePart.inlineData.data, 'base64')
    }

    // ------------------------------------------------------------------------
    // PATH B: OpenAI / DALL-E Image Generation
    // ------------------------------------------------------------------------
    const parts: string[] = []
    parts.push(`Art style: ${imageStyle}`)
    if (characterBible) {
        parts.push(`CHARACTER REFERENCE (maintain these exact appearances throughout):\n${characterBible}`)
    }
    parts.push(`Scene for Chapter ${chapterNumber}: ${sceneText}`)
    parts.push(`LAYOUT: Full-page square illustration. Compose the scene naturally. Do NOT include any text, words, letters, or writing in the image.`)
    parts.push(`CRITICAL: Do NOT invent, assume, or add ANY characters, animals, sidekicks, or pets that are NOT explicitly mentioned in the text above.`)
    parts.push(`High quality, detailed, warm and inviting, age-appropriate for children ages 4-10. No text in image.`)

    const prompt = parts.join('\n\n')

    const response = await openai.images.generate({
        model: imageModel,
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json'
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error('No image data in OpenAI response')

    return Buffer.from(b64, 'base64')
}
