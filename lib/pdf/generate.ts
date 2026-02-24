import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://poppingtime.com'

interface Chapter {
    chapterNumber: number
    content: string // rewrite or cleaned transcript
    illustrationBuffer?: Buffer
}

export async function generateStoryPDF(
    bookTitle: string,
    chapters: Chapter[],
    authorName: string
): Promise<Buffer> {
    const doc = await PDFDocument.create()
    const fontRegular = await doc.embedFont(StandardFonts.TimesRoman)
    const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)

    // 8.5 x 8.5 inches at 72 dpi
    const PAGE_SIZE = 612
    const MARGIN = 40
    const TEXT_SAFE_ZONE_HEIGHT = 180 // Bottom area reserved for text
    const CONTENT_W = PAGE_SIZE - MARGIN * 2

    // Helper: wrap text into lines
    function wrapText(text: string, maxWidth: number, font: typeof fontRegular, size: number): string[] {
        const clean = text
            .replace(/\r?\n/g, ' ')
            .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f]/g, '')
            .replace(/\u2014/g, '--')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201c\u201d]/g, '"')
            .replace(/\u2026/g, '...')
        const words = clean.split(/\s+/).filter(Boolean)
        const lines: string[] = []
        let current = ''
        for (const word of words) {
            const test = current ? `${current} ${word}` : word
            try {
                if (font.widthOfTextAtSize(test, size) <= maxWidth) {
                    current = test
                } else {
                    if (current) lines.push(current)
                    current = word
                }
            } catch {
                continue
            }
        }
        if (current) lines.push(current)
        return lines
    }

    // --- Cover Page ---
    const cover = doc.addPage([PAGE_SIZE, PAGE_SIZE])

    // Background cover color
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.15, 0.1, 0.3) })

    // If we have an illustration from chapter 1, we can optionally use it as cover bg
    if (chapters.length > 0 && chapters[0].illustrationBuffer) {
        try {
            const buf = chapters[0].illustrationBuffer
            const isPng = buf[0] === 0x89 && buf[1] === 0x50
            const coverImg = isPng ? await doc.embedPng(buf) : await doc.embedJpg(buf)
            cover.drawImage(coverImg, { x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, opacity: 0.6 })
        } catch { } // fallback to solid if it fails
    }

    // Centered Title Box
    const titleLines = wrapText(bookTitle.toUpperCase(), CONTENT_W - 80, fontBold, 42)
    const titleBoxH = titleLines.length * 50 + 80

    // Draw a semi-transparent box behind the title for readability
    cover.drawRectangle({
        x: MARGIN,
        y: (PAGE_SIZE - titleBoxH) / 2,
        width: PAGE_SIZE - MARGIN * 2,
        height: titleBoxH,
        color: rgb(0, 0, 0),
        opacity: 0.7
    })

    let titleY = (PAGE_SIZE + titleBoxH) / 2 - 60
    for (const line of titleLines) {
        const lineW = fontBold.widthOfTextAtSize(line, 42)
        cover.drawText(line, {
            x: (PAGE_SIZE - lineW) / 2,
            y: titleY,
            size: 42,
            font: fontBold,
            color: rgb(1, 0.95, 0.8), // Warm white
        })
        titleY -= 50
    }

    // Author
    const authorText = `by ${authorName}`
    const authorW = fontRegular.widthOfTextAtSize(authorText, 22)
    cover.drawText(authorText, {
        x: (PAGE_SIZE - authorW) / 2,
        y: (PAGE_SIZE - titleBoxH) / 2 + 25,
        size: 22,
        font: fontRegular,
        color: rgb(1, 1, 1),
    })

    // QR code at bottom center
    try {
        const qrDataUrl = await QRCode.toDataURL(SITE_URL, { width: 50, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
        const qrBase64 = qrDataUrl.split(',')[1]
        const qrImage = await doc.embedPng(Buffer.from(qrBase64, 'base64'))
        cover.drawImage(qrImage, { x: PAGE_SIZE / 2 - 25, y: 30, width: 50, height: 50 })
    } catch { }

    // --- Chapter Pages ---
    let lastChapterNumber = -1

    for (const chapter of chapters) {
        let page = doc.addPage([PAGE_SIZE, PAGE_SIZE])

        // 1. Draw Full Page Illustration Background
        if (chapter.illustrationBuffer) {
            try {
                const isPng = chapter.illustrationBuffer[0] === 0x89 && chapter.illustrationBuffer[1] === 0x50
                const img = isPng ? await doc.embedPng(chapter.illustrationBuffer) : await doc.embedJpg(chapter.illustrationBuffer)
                // Stretch to fill the square (DALL-E 3 generates 1024x1024 so it's already square)
                page.drawImage(img, { x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE })
            } catch (e) {
                console.error('Failed to embed chapter image:', e)
                // Fallback background if image fails
                page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.95, 0.93, 0.9) })
            }
        } else {
            page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.95, 0.93, 0.9) })
        }

        // 2. Draw Text Overlay Base
        // We draw a solid or gradient strip at the bottom. Since pdf-lib doesn't have native gradients,
        // we'll draw a solid dark overlay box with some opacity.
        const bodyLines = wrapText(chapter.content, CONTENT_W, fontRegular, 16)

        // Only allocate space for the header if this is the FIRST page of a new chapter
        const isNewChapter = chapter.chapterNumber !== lastChapterNumber
        const headerHeight = isNewChapter ? 30 : 0

        const textHeightNeeded = bodyLines.length * 24 + 40 + headerHeight
        const boxHeight = Math.max(TEXT_SAFE_ZONE_HEIGHT, textHeightNeeded)

        page.drawRectangle({
            x: 0,
            y: 0,
            width: PAGE_SIZE,
            height: boxHeight,
            color: rgb(0, 0, 0),
            opacity: 0.65 // Dark enough for white text to be readable
        })

        // 3. Draw Text
        // Chapter header (only on first page of new chapter)
        let curY = boxHeight - 40

        if (isNewChapter) {
            const chapterLabel = `Chapter ${chapter.chapterNumber}`
            page.drawText(chapterLabel.toUpperCase(), {
                x: MARGIN,
                y: curY,
                size: 14,
                font: fontBold,
                color: rgb(1, 0.85, 0.4), // Golden yellow
            })
            curY -= 30
            lastChapterNumber = chapter.chapterNumber
        }

        // Body text
        for (const line of bodyLines) {
            // If body is extremely long, we might need a continuation page, but typically 
            // children's books have minimal text per page. AI rewrite keeps it short.
            if (curY < MARGIN) {
                // VERY long text edge case - start new page
                addFooter(page, bookTitle, fontRegular, PAGE_SIZE, 20)
                page = doc.addPage([PAGE_SIZE, PAGE_SIZE])
                page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.1, 0.1, 0.1) })
                curY = PAGE_SIZE - MARGIN - 40
            }

            page.drawText(line, {
                x: MARGIN,
                y: curY,
                size: 16,
                font: fontRegular,
                color: rgb(1, 1, 1), // White text
                lineHeight: 24,
            })
            curY -= 24
        }

        addFooter(page, bookTitle, fontRegular, PAGE_SIZE, 20)
    }

    // Add final author sign-off to the very last page
    const lastPage = doc.getPage(doc.getPageCount() - 1)
    const finalAuthorText = `Written by ${authorName}`
    const finalAuthorW = fontRegular.widthOfTextAtSize(finalAuthorText, 14)
    lastPage.drawText(finalAuthorText, {
        x: PAGE_SIZE - MARGIN - finalAuthorW,
        y: 20,
        size: 14,
        font: fontRegular,
        color: rgb(1, 1, 1),
    })

    const bytes = await doc.save()
    return Buffer.from(bytes)
}

function addFooter(page: PDFPage, bookTitle: string, font: typeof StandardFonts.TimesRoman | any, pageW: number, margin: number) {
    const siteText = `poppingtime.com  ·  ${bookTitle}`
    const footerW = font.widthOfTextAtSize(siteText, 10)
    page.drawText(siteText, {
        x: (pageW - footerW) / 2,
        y: margin,
        size: 10,
        font,
        color: rgb(0.8, 0.8, 0.8),
    })
}
