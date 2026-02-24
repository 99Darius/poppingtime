import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateIllustration(
    chapterText: string,
    imageStyle: string,
    chapterNumber: number
): Promise<Buffer> {
    const prompt = `${imageStyle}. Children's book illustration for chapter ${chapterNumber}. Scene: ${chapterText.substring(0, 500)}. Warm, inviting, age-appropriate for 8-12 year olds. No text in image.`

    const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) throw new Error('No image data in response')

    return Buffer.from(b64, 'base64')
}
