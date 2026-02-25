import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateIllustration, generateCharacterBible, generateReferenceImage } from '@/lib/ai/illustrate'
import { determineOptimalTextPlacement } from '@/lib/ai/image-analysis'
import { generateStoryPDF } from '@/lib/pdf/generate'
import { sendIllustratedBookReadyEmail } from '@/lib/resend'

export const maxDuration = 300

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

        // Get admin config for image style and model
        const { data: config } = await supabase.from('admin_config').select('image_style, image_model').single()
        const imageStyle = config?.image_style || 'watercolor illustration, children\'s book style'
        const imageModel = config?.image_model || 'dall-e-3'

        // Pre-fetch all best available text to generate the character bible
        const chaptersWithText = []
        for (const ch of chapters || []) {
            const { data: rewrite } = await supabase
                .from('rewrites')
                .select('content')
                .eq('chapter_id', ch.id)
                .eq('scope', 'chapter')
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const content = rewrite?.content || ch.transcript_cleaned || ch.transcript_original || ''
            chaptersWithText.push({ chapterNumber: ch.chapter_number, content, originalChapter: ch })
        }

        // Generate Character Bible
        let characterBible = ''
        try {
            console.log('Generating Character Bible for book', bookId)
            characterBible = await generateCharacterBible(chaptersWithText.map(c => ({
                chapterNumber: c.chapterNumber,
                content: c.content
            })))
            console.log('Character Bible generated:\n', characterBible)
        } catch (e) {
            console.error('Failed to generate character bible:', e)
            // graceful degradation: just proceed without it
        }

        // Under generation of character bible:
        let referenceBuffer: Buffer | null = null;
        if (characterBible) {
            console.log('Generating master reference image...');
            referenceBuffer = await generateReferenceImage(characterBible, imageStyle, imageModel);
        }

        // --------------------------------------------------------------------
        // Paginate Chapters — with smart page budget allocation
        // --------------------------------------------------------------------
        const { paginateChapter } = await import('@/lib/ai/pagination')
        const allPages: { chapterNumber: number; content: string; illustrationPrompt: string; textPlacement: 'top' | 'bottom' }[] = []

        const MAX_TOTAL_PAGES = 30
        // Compute proportional page budgets based on text length
        const totalCharacters = chaptersWithText.reduce((sum, c) => sum + c.content.length, 0)
        const chapterBudgets = chaptersWithText.map(c => {
            const proportion = totalCharacters > 0 ? c.content.length / totalCharacters : 1 / chaptersWithText.length
            return Math.max(2, Math.round(proportion * MAX_TOTAL_PAGES))
        })
        // If budget sum exceeds max, proportionally scale down (keeping min 2)
        let budgetSum = chapterBudgets.reduce((a, b) => a + b, 0)
        while (budgetSum > MAX_TOTAL_PAGES) {
            const largestIdx = chapterBudgets.indexOf(Math.max(...chapterBudgets))
            if (chapterBudgets[largestIdx] <= 2) break
            chapterBudgets[largestIdx]--
            budgetSum--
        }

        for (let ci = 0; ci < chaptersWithText.length; ci++) {
            const c = chaptersWithText[ci]
            const budget = chapterBudgets[ci]
            try {
                console.log(`Paginating chapter ${c.chapterNumber} (budget: ${budget} pages)...`)
                const { pages } = await paginateChapter(c.content, c.chapterNumber, budget)
                for (const p of pages) {
                    allPages.push({
                        chapterNumber: c.chapterNumber,
                        content: p.content,
                        illustrationPrompt: p.illustrationPrompt,
                        textPlacement: p.textPlacement || 'bottom'
                    })
                }
            } catch (e) {
                console.error(`Pagination failed for chapter ${c.chapterNumber}, falling back to single page.`, e)
                allPages.push({
                    chapterNumber: c.chapterNumber,
                    content: c.content,
                    illustrationPrompt: c.content.substring(0, 300),
                    textPlacement: 'bottom'
                })
            }
        }

        console.log(`Total pages after smart pagination: ${allPages.length}`)

        // --------------------------------------------------------------------
        // Generate illustrations for each PAGE in batches (concurrency = 5)
        // --------------------------------------------------------------------
        const CONCURRENCY = 5;
        const pageData = new Array(allPages.length);

        for (let i = 0; i < allPages.length; i += CONCURRENCY) {
            const batch = allPages.slice(i, i + CONCURRENCY);
            console.log(`Generating illustrations for pages ${i + 1} to ${Math.min(i + CONCURRENCY, allPages.length)} (Batch ${Math.floor(i / CONCURRENCY) + 1})...`);

            const results = await Promise.all(batch.map(async (page, index) => {
                const { content, chapterNumber, illustrationPrompt, textPlacement } = page;
                const pageIndex = i + index + 1;

                let illustrationBuffer: Buffer | undefined;
                let optimalPlacement: 'top' | 'bottom' = textPlacement;

                try {
                    console.log(`Starting image generation for page ${pageIndex} (Chapter ${chapterNumber})...`);
                    illustrationBuffer = await generateIllustration(
                        illustrationPrompt,
                        imageStyle,
                        chapterNumber,
                        imageModel,
                        characterBible,
                        referenceBuffer || undefined,
                        textPlacement
                    );

                    if (illustrationBuffer) {
                        optimalPlacement = await determineOptimalTextPlacement(illustrationBuffer);
                    }
                    console.log(`Finished image for page ${pageIndex}. Optimal text placement: ${optimalPlacement}`);
                } catch (e) {
                    console.error(`Illustration generation failed for page ${pageIndex}:`, e);
                }

                return {
                    chapterNumber,
                    content,
                    illustrationBuffer,
                    textPlacement: optimalPlacement
                };
            }));

            results.forEach((res, index) => {
                pageData[i + index] = res;
            });
        }

        // Get author name
        const { data: authUser } = await supabase.auth.admin.getUserById(book.owner_id)
        const authorName = authorString || authUser?.user?.user_metadata?.display_name || authUser?.user?.email || 'Anonymous'

        // Generate PDF
        const pdfBuffer = await generateStoryPDF(book.title, pageData, authorName)

        // Upload PDF
        const pdfPath = `${bookId}/${Date.now()}-illustrated.pdf`
        const { error: uploadError } = await supabase.storage.from('pdfs').upload(pdfPath, pdfBuffer, { contentType: 'application/pdf' })
        if (uploadError) {
            throw new Error(`PDF upload failed: ${uploadError.message}`)
        }

        // Create signed URL (7 days)
        const { data: signedUrl, error: signError } = await supabase.storage.from('pdfs').createSignedUrl(pdfPath, 7 * 24 * 3600)
        if (signError || !signedUrl) {
            throw new Error(`Failed to generate signed URL: ${signError?.message || 'unknown error'}`)
        }

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
