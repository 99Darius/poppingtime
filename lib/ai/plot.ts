import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type PlotTone = 'funny' | 'adventurous' | 'magical' | 'spooky' | 'scifi' | 'animal'

export interface PlotOutput {
    title: string
    hook: string
    problem: string
    action: string[]
    climax: string
    resolution: string
    characters: {
        protagonist: string
        companion?: string
        mentor?: string
        antagonist?: string
    }
}

export async function generatePlot(
    tone: PlotTone,
    model: string,
    maxBullets: number,
    creativity: number,
    promptTemplate: string
): Promise<{ plot: PlotOutput; usage: any }> {
    const toneDescriptions: Record<PlotTone, string> = {
        funny: 'hilarious, absurd, with lots of comic situations',
        adventurous: 'exciting, action-packed with daring quests',
        magical: 'enchanting, with wonder and magical elements',
        spooky: 'mildly spooky, mysterious but not actually scary',
        scifi: 'futuristic, space or science fiction adventures',
        animal: 'featuring talking animals in fun situations',
    }

    const finalPrompt = promptTemplate
        .replace(/\{\{toneDescription\}\}/g, toneDescriptions[tone])
        .replace(/\{\{maxBullets\}\}/g, maxBullets.toString())

    const response = await openai.chat.completions.create({
        model: model.startsWith('claude') ? 'gpt-5.2' : model,
        temperature: creativity,
        max_completion_tokens: 1024,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: 'You are a creative children\'s story writer. Always respond with valid JSON.',
            },
            {
                role: 'user',
                content: finalPrompt,
            },
        ],
    })

    const content = response.choices[0]?.message?.content
    const usage = response.usage || null

    if (!content) throw new Error('No response from OpenAI')

    try {
        const plot = JSON.parse(content) as PlotOutput
        return { plot, usage }
    } catch {
        // Fallback if JSON parse fails
        return {
            usage,
            plot: {
                title: 'The Dragon\'s Lost Homework',
                hook: 'A dragon loses its magical homework on the way to school.',
                problem: 'The homework has sprouted legs and is running away.',
                action: [
                    'Chasing the paper through the enchanted forest.',
                    'The homework tricks a toll-bridge troll.',
                    'A flock of fire-birds try to nest on the essay.'
                ],
                climax: 'The dragon must use its ice-breath to freeze the paper before it burns up in a volcano.',
                resolution: 'The dragon safely delivers the frozen homework to the teacher.',
                characters: {
                    protagonist: 'Blaze — a clumsy but good-hearted young dragon',
                    companion: 'Fern — a tiny fairy who is good at finding things',
                    mentor: 'Professor Grumbleton — the wise wizard teacher',
                    antagonist: 'The Homework — surprisingly fast and sneaky',
                },
            }
        }
    }
}
