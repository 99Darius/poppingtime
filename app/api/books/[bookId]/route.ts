import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props {
    params: Promise<{ bookId: string }>
}

export async function GET(_: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: book } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

    return NextResponse.json(book)
}

export async function PATCH(request: NextRequest, { params }: Props) {
    const { bookId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { data: book, error } = await supabase
        .from('books')
        .update({ title: body.title, updated_at: new Date().toISOString() })
        .eq('id', bookId)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(book)
}
