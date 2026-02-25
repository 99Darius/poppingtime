import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Props {
    params: Promise<{ chapterId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    const { chapterId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = await request.json()
    if (typeof content !== 'string') {
        return NextResponse.json({ error: 'Content must be a string' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // 1. Verify ownership
    const { data: chapter } = await supabase
        .from('chapters')
        .select('book_id')
        .eq('id', chapterId)
        .single()

    if (!chapter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 2. Update the transcript explicitly as cleaned
    const { error } = await serviceClient
        .from('chapters')
        .update({ transcript_cleaned: content })
        .eq('id', chapterId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, content })
}
