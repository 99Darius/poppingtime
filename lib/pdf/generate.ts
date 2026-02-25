import { PDFDocument, rgb, PDFPage, StandardFonts } from 'pdf-lib'
import sharp from 'sharp'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://poppingtime.com'

interface Chapter {
    chapterNumber: number
    content: string
    illustrationBuffer?: Buffer
    textPlacement?: 'top' | 'bottom'
}

export async function generateStoryPDF(
    bookTitle: string,
    chapters: Chapter[],
    authorName: string
): Promise<Buffer> {
    const doc = await PDFDocument.create()

    // Use built-in Helvetica (Sans-Serif) to guarantee no file-loading crashes
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

    // 8.5 x 8.5 inches at 72 dpi
    const PAGE_SIZE = 612
    const MARGIN = 40
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
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.15, 0.1, 0.25) })

    // Optional illustration from chapter 1 as cover bg
    if (chapters.length > 0 && chapters[0].illustrationBuffer) {
        try {
            const compressedCover = await sharp(chapters[0].illustrationBuffer)
                .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer()
            const coverImg = await doc.embedJpg(compressedCover)
            cover.drawImage(coverImg, { x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, opacity: 0.8 })
        } catch { }
    }

    // Title — compact rounded rectangle at the BOTTOM of the cover (avoids blocking faces)
    const titleLines = wrapText(bookTitle.toUpperCase(), CONTENT_W - 60, fontBold, 36)
    const titleLineHeight = 44
    const titlePadding = 24
    const titleBlockH = titleLines.length * titleLineHeight + titlePadding * 2 + 40 // +40 for author
    const titleBlockY = 20 // Bottom of cover
    const titleBlockW = Math.min(
        CONTENT_W,
        Math.max(...titleLines.map(l => fontBold.widthOfTextAtSize(l, 36))) + titlePadding * 2 + 20
    )
    const titleBlockX = (PAGE_SIZE - titleBlockW) / 2

    // Rounded rectangle backdrop
    cover.drawRectangle({
        x: titleBlockX,
        y: titleBlockY,
        width: titleBlockW,
        height: titleBlockH,
        color: rgb(1, 1, 1),
        opacity: 0.88,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0,
    })

    let titleY = titleBlockY + titleBlockH - titlePadding - 10
    for (const line of titleLines) {
        const lineW = fontBold.widthOfTextAtSize(line, 36)
        cover.drawText(line, {
            x: (PAGE_SIZE - lineW) / 2,
            y: titleY,
            size: 36,
            font: fontBold,
            color: rgb(0.1, 0.1, 0.2),
        })
        titleY -= titleLineHeight
    }

    // Author Name directly under title
    const authorText = `by ${authorName}`
    const authorW = fontRegular.widthOfTextAtSize(authorText, 20)
    cover.drawText(authorText, {
        x: (PAGE_SIZE - authorW) / 2,
        y: titleBlockY + titlePadding,
        size: 20,
        font: fontRegular,
        color: rgb(0.35, 0.35, 0.35),
    })

    // --- Chapter Pages ---
    let lastChapterNumber = -1
    const BODY_FONT_SIZE = 17
    const BODY_LINE_HEIGHT = 24
    const TEXT_PADDING_X = 20
    const TEXT_PADDING_Y = 16
    const TEXT_MAX_W = CONTENT_W * 0.72 // Text block is max ~72% of page width for variation

    for (const chapter of chapters) {
        let page = doc.addPage([PAGE_SIZE, PAGE_SIZE])

        // 1. Draw Full Page Illustration
        if (chapter.illustrationBuffer) {
            try {
                const compressedImage = await sharp(chapter.illustrationBuffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toBuffer()

                const img = await doc.embedJpg(compressedImage)
                page.drawImage(img, { x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE })
            } catch (e) {
                console.error('Failed to embed chapter image:', e)
                page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.95, 0.93, 0.9) })
            }
        } else {
            page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.95, 0.93, 0.9) })
        }

        // 2. Text layout calculations — compact, right-inset
        const bodyLines = wrapText(chapter.content, TEXT_MAX_W - TEXT_PADDING_X * 2, fontRegular, BODY_FONT_SIZE)
        const isNewChapter = chapter.chapterNumber !== lastChapterNumber
        const chapterHeaderH = isNewChapter ? 28 : 0
        const textContentH = bodyLines.length * BODY_LINE_HEIGHT + chapterHeaderH
        const boxH = textContentH + TEXT_PADDING_Y * 2

        // Compute actual width needed (based on longest line)
        const maxLineW = Math.max(
            ...bodyLines.map(l => fontRegular.widthOfTextAtSize(l, BODY_FONT_SIZE)),
            isNewChapter ? fontBold.widthOfTextAtSize(`CHAPTER ${chapter.chapterNumber}`, 13) : 0
        )
        const boxW = Math.min(TEXT_MAX_W, maxLineW + TEXT_PADDING_X * 2 + 12)

        const isTop = chapter.textPlacement === 'top'

        // Position: inset from the right edge, at top or bottom
        const boxX = PAGE_SIZE - boxW - 24
        const boxY = isTop ? PAGE_SIZE - boxH - 16 : 16

        // 3. Draw compact rounded-rectangle backdrop (semi-transparent white)
        // pdf-lib doesn't have borderRadius so we draw a simple rect with slight appearance tricks
        page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxW,
            height: boxH,
            color: rgb(1, 1, 1),
            opacity: 0.88,
        })

        // 4. Draw Text Elements
        let curY = boxY + boxH - TEXT_PADDING_Y - 4

        if (isNewChapter) {
            const chapterLabel = `CHAPTER ${chapter.chapterNumber}`
            page.drawText(chapterLabel, {
                x: boxX + TEXT_PADDING_X,
                y: curY,
                size: 13,
                font: fontBold,
                color: rgb(0.3, 0.5, 0.8),
            })
            curY -= 26
            lastChapterNumber = chapter.chapterNumber
        }

        for (const line of bodyLines) {
            if (curY < MARGIN) {
                page = doc.addPage([PAGE_SIZE, PAGE_SIZE])
                page.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(1, 1, 1) })
                curY = PAGE_SIZE - MARGIN - 40
            }

            page.drawText(line, {
                x: boxX + TEXT_PADDING_X,
                y: curY,
                size: BODY_FONT_SIZE,
                font: fontRegular,
                color: rgb(0.12, 0.12, 0.12),
                lineHeight: BODY_LINE_HEIGHT,
            })
            curY -= BODY_LINE_HEIGHT
        }
    }

    // --- Back Cover Page ---
    const backCover = doc.addPage([PAGE_SIZE, PAGE_SIZE])
    backCover.drawRectangle({ x: 0, y: 0, width: PAGE_SIZE, height: PAGE_SIZE, color: rgb(0.12, 0.12, 0.15) })

    const backTitleLines = wrapText(bookTitle, CONTENT_W, fontBold, 24)
    let backY = PAGE_SIZE / 2 + 60
    for (const text of backTitleLines) {
        const blw = fontBold.widthOfTextAtSize(text, 24)
        backCover.drawText(text, {
            x: (PAGE_SIZE - blw) / 2,
            y: backY,
            size: 24,
            font: fontBold,
            color: rgb(1, 1, 1)
        })
        backY -= 35
    }

    const backAuthor = `Written by ${authorName}`
    const baw = fontRegular.widthOfTextAtSize(backAuthor, 16)
    backCover.drawText(backAuthor, {
        x: (PAGE_SIZE - baw) / 2,
        y: backY,
        size: 16,
        font: fontRegular,
        color: rgb(0.8, 0.8, 0.8)
    })

    const creditText = "Created magically on poppingtime.com"
    const cw = fontRegular.widthOfTextAtSize(creditText, 14)
    backCover.drawText(creditText, {
        x: (PAGE_SIZE - cw) / 2,
        y: 60,
        size: 14,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.6)
    })

    const bytes = await doc.save()
    return Buffer.from(bytes)
}
