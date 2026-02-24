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

        const plot = await generatePlot(
            (tone || config?.plot_tone || 'funny') as PlotTone,
            config?.plot_model || 'gpt-5.2',
            config?.plot_max_bullets || 5,
            config?.creativity_level || 0.9
        )

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
