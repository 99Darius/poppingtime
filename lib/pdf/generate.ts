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

    const PAGE_W = 595
    const PAGE_H = 842
    const MARGIN = 60
    const CONTENT_W = PAGE_W - MARGIN * 2

    // Helper: wrap text into lines
    function wrapText(text: string, maxWidth: number, font: typeof fontRegular, size: number): string[] {
        // Replace newlines with spaces, strip any chars WinAnsi can't encode
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
                // Skip words with unencodable characters
                continue
            }
        }
        if (current) lines.push(current)
        return lines
    }

    // --- Cover Page ---
    const cover = doc.addPage([PAGE_W, PAGE_H])

    // Background gradient effect (layered rectangles)
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(0.49, 0.36, 0.75) })
    cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H / 2, color: rgb(0.39, 0.24, 0.65), opacity: 0.5 })

    // Title
    const titleLines = wrapText(bookTitle.toUpperCase(), CONTENT_W - 40, fontBold, 36)
    let titleY = PAGE_H / 2 + titleLines.length * 22
    for (const line of titleLines) {
        const lineW = fontBold.widthOfTextAtSize(line, 36)
        cover.drawText(line, {
            x: (PAGE_W - lineW) / 2,
            y: titleY,
            size: 36,
            font: fontBold,
            color: rgb(1, 1, 1),
        })
        titleY -= 48
    }

    // Author
    const authorText = `by ${authorName}`
    const authorW = fontRegular.widthOfTextAtSize(authorText, 18)
    cover.drawText(authorText, {
        x: (PAGE_W - authorW) / 2,
        y: PAGE_H / 2 - 60,
        size: 18,
        font: fontRegular,
        color: rgb(0.85, 0.75, 1),
    })

    // Footer branding
    const brandText = 'Created with Popping Time'
    const brandW = fontRegular.widthOfTextAtSize(brandText, 11)
    cover.drawText(brandText, {
        x: (PAGE_W - brandW) / 2,
        y: 40,
        size: 11,
        font: fontRegular,
        color: rgb(0.85, 0.75, 1),
    })

    // QR code
    try {
        const qrDataUrl = await QRCode.toDataURL(SITE_URL, { width: 60, margin: 1 })
        const qrBase64 = qrDataUrl.split(',')[1]
        const qrImage = await doc.embedPng(Buffer.from(qrBase64, 'base64'))
        cover.drawImage(qrImage, { x: PAGE_W / 2 - 30, y: 55, width: 60, height: 60 })
    } catch { }

    // --- Chapter Pages ---
    for (const chapter of chapters) {
        let page = doc.addPage([PAGE_W, PAGE_H])

        // Chapter header
        const chapterLabel = `Chapter ${chapter.chapterNumber}`
        const chapterLabelW = fontBold.widthOfTextAtSize(chapterLabel, 13)
        page.drawText(chapterLabel.toUpperCase(), {
            x: (PAGE_W - chapterLabelW) / 2,
            y: PAGE_H - MARGIN - 10,
            size: 13,
            font: fontBold,
            color: rgb(0.49, 0.36, 0.75),
        })

        // Illustration
        let textStartY = PAGE_H - MARGIN - 60
        if (chapter.illustrationBuffer) {
            try {
                // Auto-detect PNG vs JPEG by magic bytes
                const isPng = chapter.illustrationBuffer[0] === 0x89 && chapter.illustrationBuffer[1] === 0x50
                const img = isPng
                    ? await doc.embedPng(chapter.illustrationBuffer)
                    : await doc.embedJpg(chapter.illustrationBuffer)
                const imgH = 220
                const imgW = (img.width / img.height) * imgH
                const imgX = (PAGE_W - imgW) / 2
                page.drawImage(img, { x: imgX, y: textStartY - imgH, width: imgW, height: imgH })
                textStartY -= imgH + 20
            } catch { }
        }

        // Body text
        const bodyLines = wrapText(chapter.content, CONTENT_W, fontRegular, 13)
        let curY = textStartY

        for (const line of bodyLines) {
            if (curY < MARGIN + 40) {
                // Add footer to current page
                addFooter(page, bookTitle, fontRegular, PAGE_W, MARGIN)
                page = doc.addPage([PAGE_W, PAGE_H])
                curY = PAGE_H - MARGIN - 20
            }
            page.drawText(line, {
                x: MARGIN,
                y: curY,
                size: 13,
                font: fontRegular,
                color: rgb(0.1, 0.05, 0.2),
                lineHeight: 20,
            })
            curY -= 22
        }

        addFooter(page, bookTitle, fontRegular, PAGE_W, MARGIN)
    }

    // Add final author sign-off to the very last page
    const lastPage = doc.getPage(doc.getPageCount() - 1)
    const finalAuthorText = `Written by ${authorName}`
    const finalAuthorW = fontRegular.widthOfTextAtSize(finalAuthorText, 12)
    lastPage.drawText(finalAuthorText, {
        x: PAGE_W - MARGIN - finalAuthorW,
        y: MARGIN,
        size: 12,
        font: fontRegular,
        color: rgb(0.49, 0.36, 0.75),
    })

    const bytes = await doc.save()
    return Buffer.from(bytes)
}

function addFooter(page: PDFPage, bookTitle: string, font: typeof StandardFonts.TimesRoman | any, pageW: number, margin: number) {
    const siteText = `poppingtime.com  ·  ${bookTitle}`
    const footerW = font.widthOfTextAtSize(siteText, 9)
    page.drawText(siteText, {
        x: (pageW - footerW) / 2,
        y: margin - 30,
        size: 9,
        font,
        color: rgb(0.6, 0.5, 0.75),
    })
}
