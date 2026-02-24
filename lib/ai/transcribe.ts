import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import os from 'os'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    const tmpPath = path.join(os.tmpdir(), filename)
    fs.writeFileSync(tmpPath, audioBuffer)

    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: 'whisper-1',
        language: 'en',
    })

    fs.unlinkSync(tmpPath)
    return transcription.text
}
