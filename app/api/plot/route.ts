import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generatePlot, type PlotTone } from '@/lib/ai/plot'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tone } = await request.json()

    try {
        const serviceClient = await createServiceClient()
        const { data: config } = await serviceClient.from('admin_config').select('*').single()

        const defaultPlotPrompt = `Generate a {{toneDescription}} children's bedtime story outline for ages 8-12. Be creative, playful, and imaginative. Keep it child-appropriate. Use easy-to-understand words.
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
  "action": ["obstacle 1 (max 10 words)", "obstacle 2 (max 10 words)", "obstacle 3 (max 10 words)"] (up to {{maxBullets}} bullets),
  "climax": "Biggest challenge (max 10 words)",
  "resolution": "How it all ends (1 sentence)",
  "characters": {
    "protagonist": "Name — one-line fun description matching the plot",
    "companion": "Name — one-line fun description matching the plot",
    "mentor": "Name — one-line fun description matching the plot",
    "antagonist": "Name — one-line fun description matching the plot"
  }
}`

        const { plot, usage } = await generatePlot(
            (tone || config?.plot_tone || 'funny') as PlotTone,
            config?.plot_model || 'gpt-4o',
            config?.plot_max_bullets || 5,
            config?.creativity_level || 0.9,
            config?.plot_prompt || defaultPlotPrompt
        )

        if (usage) {
            await serviceClient.from('system_logs').insert({
                user_id: user.id,
                event_type: 'plot_generated',
                message: 'Generated story plot',
                metadata: { usage, model: config?.plot_model || 'gpt-4o' }
            })
        }

        return NextResponse.json(plot)
    } catch (err) {
        console.error('[plot] Generation failed:', err)
        // Return a fun fallback instead of an error
        return NextResponse.json({
            hook: 'A dragon whose homework got eaten by its dog is panicking on the way to school.',
            incitingIncident: 'The dragon discovers their homework has come alive and is causing chaos in the classroom.',
            risingAction: [
                'The homework runs into the science lab and causes explosions',
                'The teacher threatens to call the parents',
                'The dragon must chase it through the cafeteria',
            ],
            climax: 'The dragon must use their fire breath in a surprising way to catch the homework before it escapes the school forever.',
            resolution: 'The homework is caught, the dragon learns to always back up their work, and everyone has a story to tell.',
            characters: {
                protagonist: 'Blaze — a clumsy but good-hearted young dragon',
                companion: 'Fern — a tiny fairy who is very good at finding lost things',
                mentor: 'Professor Grumbleton — the wise but absentminded wizard teacher',
                antagonist: 'The Homework itself — surprisingly fast and very sneaky',
            },
        })
    }
}
