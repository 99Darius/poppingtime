import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createServiceClient()
    const { data: config } = await supabase.from('admin_config').select('*').single()
    return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
    const body = await request.json()
    const supabase = await createServiceClient()

    const { error } = await supabase
        .from('admin_config')
        .update({
            rewrite_model: body.rewrite_model,
            plot_model: body.plot_model,
            image_model: body.image_model,
            image_style: body.image_style,
            plot_tone: body.plot_tone,
            plot_max_bullets: body.plot_max_bullets,
            creativity_level: body.creativity_level,
            rewrite_prompt: body.rewrite_prompt,
            plot_prompt: body.plot_prompt,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Insert history snapshot
    await supabase.from('admin_config_history').insert({
        config_snapshot: {
            rewrite_model: body.rewrite_model,
            plot_model: body.plot_model,
            image_model: body.image_model,
            image_style: body.image_style,
            plot_tone: body.plot_tone,
            plot_max_bullets: body.plot_max_bullets,
            creativity_level: body.creativity_level,
            rewrite_prompt: body.rewrite_prompt,
            plot_prompt: body.plot_prompt,
        }
    })

    return NextResponse.json({ success: true })
}
