import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface PagePlan {
    content: string
    illustrationPrompt: string
    textPlacement: 'top' | 'bottom'
}

export async function paginateChapter(
    chapterText: string,
    chapterNumber: number,
    maxPages: number = 10
): Promise<{ pages: PagePlan[], usage: any }> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are an expert children's picture book editor and art director. 
Your job is to take a chapter of text and break it down into an array of strictly paced "pages" for a visual book.

CRITICAL RULES:
1. You MUST produce AT MOST ${maxPages} pages for this chapter. If the chapter is short, you may produce fewer.
2. Each page should contain 1 to 4 sentences. If the text is long and you are running low on page budget, combine more sentences per page. The ENTIRE chapter text MUST be included — do NOT drop or omit any text.
3. The pacing must feel natural for a child reading it aloud.
4. You must not change, rewrite, or omit any narrative text. The text across all pages must perfectly reconstruct the original chapter text.
5. For each page, provide a concise \`illustrationPrompt\` describing only the visual scene. Focus on who is doing what, where they are, and the time/lighting. 
6. DO NOT invent characters or animals that are not explicitly mentioned in the text.
7. For \`textPlacement\`, choose whether "top" or "bottom" makes more sense based on the visual action, and try to vary it occasionally so every page isn't identical.`
            },
            {
                role: 'user',
                content: `Please paginate Chapter ${chapterNumber}:\n\n${chapterText}`
            }
        ],
        temperature: 0.2,
        response_format: {
            // Using a simple JSON schema for exactly what we need
            type: "json_schema",
            json_schema: {
                name: "pagination_plan",
                schema: {
                    type: "object",
                    properties: {
                        pages: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    content: { type: "string", description: "The exact 1-3 sentences of narrative text for this page." },
                                    illustrationPrompt: { type: "string", description: "Concise visual description of the scene for the illustrator." },
                                    textPlacement: { type: "string", enum: ["top", "bottom"], description: "Whether the text overlay should be at the top or bottom of the page." }
                                },
                                required: ["content", "illustrationPrompt", "textPlacement"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["pages"],
                    additionalProperties: false
                },
                strict: true
            }
        }
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error('No pagination response')

    const parsed = JSON.parse(raw) as { pages: PagePlan[] }
    return { pages: parsed.pages, usage: response.usage }
}
