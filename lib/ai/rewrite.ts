import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function rewriteChapter(
    transcript: string,
    model: string,
    prompt: string,
    temperature: number = 0.0
): Promise<{ text: string; usage: any }> {
    const response = await openai.chat.completions.create({
        model: model.startsWith('claude') ? 'gpt-5.2' : model,
        temperature: 0.0, // Force 0 for strict cleanup
        max_completion_tokens: 4096,
        messages: [
            {
                role: 'system',
                content: prompt,
            },
            {
                role: 'user',
                content: `Clean up this voice-recorded story chapter transcript without changing the story:\n\n${transcript}`,
            },
        ],
    })

    return {
        text: response.choices[0]?.message?.content || transcript,
        usage: response.usage || null
    }
}

export async function rewriteBook(
    chapters: { chapterNumber: number; transcript: string }[],
    model: string
): Promise<{ text: string; usage: any }> {
    const allChapters = chapters
        .map((c) => `Chapter ${c.chapterNumber}:\n${c.transcript}`)
        .join('\n\n---\n\n')

    const response = await openai.chat.completions.create({
        model: model.startsWith('claude') ? 'gpt-5.2' : model,
        max_completion_tokens: 8192,
        messages: [
            {
                role: 'system',
                content: 'You are a talented children\'s book author. Rewrite complete voice-recorded stories into polished, beautifully written children\'s books for ages 8-12. Maintain the original plot, characters, and voice. Make it engaging, warm, and fun to read aloud.',
            },
            {
                role: 'user',
                content: `Rewrite this complete story:\n\n${allChapters}\n\nReturn the full rewritten story with "Chapter 1:", "Chapter 2:" etc. headers.`,
            },
        ],
    })

    return {
        text: response.choices[0]?.message?.content || allChapters,
        usage: response.usage || null
    }
}
