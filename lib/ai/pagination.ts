import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface PagePlan {
    content: string
    illustrationPrompt: string
}

export async function paginateChapter(
    chapterText: string,
    chapterNumber: number
): Promise<{ pages: PagePlan[], usage: any }> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are an expert children's picture book editor and art director. 
Your job is to take a chapter of text and break it down into an array of strictly paced "pages" for a visual book.

CRITICAL RULES:
1. Each page must contain only 1 to 3 short sentences of text (maximum 40 words per page).
2. The pacing must feel natural for a child reading it aloud, pausing at natural dramatic moments.
3. You must not change, write, or omit any narrative text. The text across all pages must perfectly reconstruct the original chapter text.
4. For each page, provide a concise \`illustrationPrompt\` describing only the visual scene. Focus on who is doing what, where they are, and the time/lighting. 
5. DO NOT invent characters or animals that are not explicitly mentioned in the text.`
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
                                    illustrationPrompt: { type: "string", description: "Concise visual description of the scene for the illustrator." }
                                },
                                required: ["content", "illustrationPrompt"],
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
