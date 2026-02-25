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
 * Generate a full-page illustration for a single chapter.
 * The prompt is built from: art style + character bible + scene + text-safe-zone instructions.
 */
export async function generateIllustration(
    chapterText: string,
    imageStyle: string,
    chapterNumber: number,
    imageModel: string,
    characterBible?: string,
    textPlacement: 'top' | 'bottom' = 'bottom'
): Promise<Buffer> {
    const sceneText = chapterText.substring(0, 600)

    // ------------------------------------------------------------------------
    // PATH A: Google / Gemini Native Image Generation
    // ------------------------------------------------------------------------
    if (imageModel.includes('gemini')) {
        // Build the strict prompt for Gemini Identity Lock
        const parts: string[] = []
        parts.push(`Art style: ${imageStyle}`)

        if (characterBible) {
            parts.push(`CHARACTER BIBLE — YOU MUST follow these exact visual descriptions for EVERY character and object. This is a STRICT visual identity lock. Do NOT deviate from ANY detail listed below. Do NOT add any characters, animals, or objects not listed here:\n${characterBible}`)
        }

        parts.push(`Scene for Chapter ${chapterNumber}: ${sceneText}`)
        const layoutInstruction = textPlacement === 'top'
            ? `LAYOUT: Full-page square illustration. Keep the TOP 20% simple/minimal (sky, ceiling, soft gradient). Main action and characters go in the CENTER and BOTTOM 80%. Do NOT include any text, words, letters, or writing in the image.`
            : `LAYOUT: Full-page square illustration. Keep the BOTTOM 20% simple/minimal (ground, floor, grass). Main action and characters go in the TOP and CENTER 80%. Do NOT include any text, words, letters, or writing in the image.`

        parts.push(layoutInstruction)
        parts.push(`CRITICAL: Do NOT invent or add ANY characters, animals, sidekicks, pets, or objects that are NOT explicitly mentioned in the story text or the character bible above. Maintain EXACT visual consistency for all characters across every page.`)
        parts.push(`High quality, detailed, warm and inviting, age-appropriate for children ages 4-10. No text in image.`)

        const prompt = parts.join('\n\n')

        // Gemini native image generation via generateContent API
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
        if (!apiKey) throw new Error('Missing GOOGLE_API_KEY for Gemini Image Generation')

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
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

        // Extract image from response parts
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
    const layoutInstruction = textPlacement === 'top'
        ? `IMPORTANT LAYOUT INSTRUCTIONS: This is a full-page illustration for a children's picture book. The illustration must fill the entire square canvas. Leave the TOP 25% of the image as a simpler, less detailed area (such as open sky, ceiling, soft clouds, or a soft gradient) so that story text can be overlaid there. Do NOT include any text, words, letters, or writing in the image. The BOTTOM 75% should contain the main scene action and characters.`
        : `IMPORTANT LAYOUT INSTRUCTIONS: This is a full-page illustration for a children's picture book. The illustration must fill the entire square canvas. Leave the BOTTOM 25% of the image as a simpler, less detailed area (such as ground, floor, grass, water, mist, or a soft gradient) so that story text can be overlaid there. Do NOT include any text, words, letters, or writing in the image. The TOP 75% should contain the main scene action and characters.`

    parts.push(layoutInstruction)
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
