import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateIllustration } from '@/lib/ai/illustrate'
import { generateStoryPDF } from '@/lib/pdf/generate'
import { sendIllustratedBookReadyEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
    const { bookId, paymentIntentId, authorString } = await request.json()
    const supabase = await createServiceClient()

    try {
        // Mark as generating
        await supabase
            .from('illustrated_books')
            .update({ status: 'generating' })
            .eq('stripe_payment_intent_id', paymentIntentId)

        // Get book data
        const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single()
        if (!book) throw new Error('Book not found')

        // Get chapters
        const { data: chapters } = await supabase
            .from('chapters')
            .select('*')
            .eq('book_id', bookId)
            .order('chapter_number')

        // Get admin config for image style
        const { data: config } = await supabase.from('admin_config').select('image_style').single()
        const imageStyle = config?.image_style || 'watercolor illustration, children\'s book style'

        // Get best available text for each chapter
        const chapterData = []
        for (const ch of chapters || []) {
            // Check for rewrites first
            const { data: rewrite } = await supabase
                .from('rewrites')
                .select('content')
                .eq('chapter_id', ch.id)
                .eq('scope', 'chapter')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const content = rewrite?.content || ch.transcript_cleaned || ch.transcript_original || ''

            // Generate illustration
            let illustrationBuffer: Buffer | undefined
            try {
                illustrationBuffer = await generateIllustration(content, imageStyle, ch.chapter_number)
            } catch (e) {
                console.error(`Illustration generation failed for chapter ${ch.chapter_number}:`, e)
            }

            chapterData.push({
                chapterNumber: ch.chapter_number,
                content,
                illustrationBuffer,
            })
        }

        // Get author name
        const { data: authUser } = await supabase.auth.admin.getUserById(book.owner_id)
        const authorName = authorString || authUser?.user?.user_metadata?.display_name || authUser?.user?.email || 'Anonymous'

        // Generate PDF
        const pdfBuffer = await generateStoryPDF(book.title, chapterData, authorName)

        // Upload PDF
        const pdfPath = `${bookId}/${Date.now()}-illustrated.pdf`
        await supabase.storage.from('pdfs').upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' })

        // Create signed URL (7 days)
        const { data: signedUrl } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 7 * 24 * 3600)

        // Update record
        await supabase
            .from('illustrated_books')
            .update({
                status: 'complete',
                pdf_path: pdfPath,
                download_url: signedUrl?.signedUrl,
                download_url_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntentId)

        // Send email
        if (authUser?.user?.email && signedUrl?.signedUrl) {
            await sendIllustratedBookReadyEmail(authUser.user.email, book.title, signedUrl.signedUrl).catch(console.error)
        }

        return NextResponse.json({ success: true, downloadUrl: signedUrl?.signedUrl })
    } catch (error: any) {
        console.error('PDF generation failed:', error)
        await supabase
            .from('illustrated_books')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntentId)

        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
