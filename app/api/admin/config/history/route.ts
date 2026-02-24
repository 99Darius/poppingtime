import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createServiceClient()
    const { data: history, error } = await supabase
        .from('admin_config_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(history)
}
