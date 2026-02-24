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
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
