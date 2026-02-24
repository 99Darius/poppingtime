import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function rewriteChapter(
    transcript: string,
    model: string,
    temperature: number = 0.0
): Promise<string> {
    const response = await openai.chat.completions.create({
        model: model.startsWith('claude') ? 'gpt-5.2' : model,
        temperature: 0.0, // Force 0 for strict cleanup
        max_completion_tokens: 4096,
        messages: [
            {
                role: 'system',
                content: 'You are an editor. Your ONLY job is to clean up a voice-recorded transcript. Fix obvious speech recognition errors, spelling, and grammar. Do NOT change the sentence structure, length, meaning, creativity, or voice. Let the user keep the exact essence of what they recorded.',
            },
            {
                role: 'user',
                content: `Clean up this voice-recorded story chapter transcript without changing the story:\n\n${transcript}`,
            },
        ],
    })

    return response.choices[0]?.message?.content || transcript
}

export async function rewriteBook(
    chapters: { chapterNumber: number; transcript: string }[],
    model: string
): Promise<string> {
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

    return response.choices[0]?.message?.content || allChapters
}
