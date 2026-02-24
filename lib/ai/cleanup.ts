import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function cleanupTranscript(rawText: string): Promise<{ text: string; usage: any }> {
    const response = await openai.chat.completions.create({
        model: 'gpt-5.2',
        max_completion_tokens: 2048,
        messages: [
            {
                role: 'system',
                content: 'You are editing a voice-recorded bedtime story chapter transcript. Fix grammar, punctuation, and filler words while keeping the narrator\'s natural voice and storytelling style. Do NOT add content. Return only the cleaned transcript.',
            },
            {
                role: 'user',
                content: rawText,
            },
        ],
    })

    return {
        text: response.choices[0]?.message?.content || rawText,
        usage: response.usage || null
    }
}
