import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createServiceClient()

    // Fetch top 100 recent system logs
    const { data: logs, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Failed to fetch system logs:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(logs || [])
}
