import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createServiceClient()

    // Total users
    const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

    // Total books
    const { count: totalBooks } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })

    // Total generated PDFs
    const { count: totalPdfs } = await supabase
        .from('illustrated_books')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'complete')

    // Recent books (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentBooks } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

    // Recording minutes aggregate
    const { data: users } = await supabase
        .from('user_profiles')
        .select('total_recording_seconds')

    const totalMinutes = Math.round((users || []).reduce((acc, u) => acc + (u.total_recording_seconds || 0), 0) / 60)

    // AI Usage Metrics
    const { data: logs } = await supabase
        .from('system_logs')
        .select('event_type, metadata')

    let totalTokens = 0
    let totalImages = 0

    if (logs) {
        for (const log of logs) {
            // Count text tokens
            if (['plot_generated', 'cleanup_generated', 'rewrite_generated', 'transcription_generated', 'pagination_generated'].includes(log.event_type)) {
                const usage = (log.metadata as any)?.usage
                if (usage && usage.total_tokens) {
                    totalTokens += usage.total_tokens
                } else if (usage && usage.input_tokens && usage.output_tokens) {
                    totalTokens += (usage.input_tokens + usage.output_tokens) // Fallback for some models
                }
            }
            // Count image generations
            else if (log.event_type === 'illustration_generated' || log.event_type === 'pdf_generated') {
                // for illustration_generated, check if it specifies how many images in metadata, otherwise assume 1
                const imgCount = (log.metadata as any)?.image_count || 1
                if (log.event_type === 'illustration_generated') {
                    totalImages += imgCount
                }
            }
        }
    }

    // Estimate cost (very rough estimate based on average blended API costs)
    // $0.01 per 1k tokens, $0.04 per image
    const estimatedCost = ((totalTokens / 1000) * 0.01) + (totalImages * 0.04)

    return NextResponse.json({
        totalUsers: totalUsers || 0,
        totalBooks: totalBooks || 0,
        totalPdfs: totalPdfs || 0,
        recentBooks: recentBooks || 0,
        totalRecordingMinutes: totalMinutes,
        totalTokens,
        totalImages,
        estimatedCost: estimatedCost.toFixed(2)
    })
}
