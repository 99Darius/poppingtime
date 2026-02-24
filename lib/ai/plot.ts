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
    creativity: number
): Promise<PlotOutput> {
    const toneDescriptions: Record<PlotTone, string> = {
        funny: 'hilarious, absurd, with lots of comic situations',
        adventurous: 'exciting, action-packed with daring quests',
        magical: 'enchanting, with wonder and magical elements',
        spooky: 'mildly spooky, mysterious but not actually scary',
        scifi: 'futuristic, space or science fiction adventures',
        animal: 'featuring talking animals in fun situations',
    }

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
                content: `Generate a ${toneDescriptions[tone]} children's bedtime story outline for ages 8-12. Be creative, playful, and imaginative. Keep it child-appropriate. Use easy-to-understand words.
CRITICAL RULES:
1. Every single aspect (hook, problem, action, climax, resolution) MUST be strictly LESS THAN 10 WORDS. Get straight to the key points and core actions. Do NOT use descriptive filler.
2. Ensure the ideas are strictly kid-friendly and concrete. Do NOT use complex adult metaphors (like paying rent, taxes, or repossessing things).
3. If introducing weird, magical, or wacky concepts, limit them to a MAXIMUM of 1 or 2 total weird ideas so the story remains easy to follow. Make sure those ideas are easily understandable.
4. The requested Characters MUST be directly linked to and suitable for the plot you generated. They must make sense in this world.

Return a valid JSON object with EXACTLY this structure:
{
  "title": "A fun, catchy title for the story",
  "hook": "Intriguing premise (max 10 words)",
  "problem": "Main conflict (max 10 words)",
  "action": ["obstacle 1 (max 10 words)", "obstacle 2 (max 10 words)", "obstacle 3 (max 10 words)"] (up to ${maxBullets} bullets),
  "climax": "Biggest challenge (max 10 words)",
  "resolution": "How it all ends (1 sentence)",
  "characters": {
    "protagonist": "Name — one-line fun description matching the plot",
    "companion": "Name — one-line fun description matching the plot",
    "mentor": "Name — one-line fun description matching the plot",
    "antagonist": "Name — one-line fun description matching the plot"
  }
}`,
            },
        ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from OpenAI')

    try {
        return JSON.parse(content) as PlotOutput
    } catch {
        // Fallback if JSON parse fails
        return {
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
