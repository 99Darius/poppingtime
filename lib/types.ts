export interface UserProfile {
    id: string
    display_name: string | null
    stripe_customer_id: string | null
    subscription_status: 'free' | 'active' | 'cancelled'
    subscription_price_id: string | null
    total_recording_seconds: number
    recording_quota_seconds: number
    free_pdf_credits: number
    created_at: string
}

export interface Book {
    id: string
    owner_id: string
    title: string
    status: 'active' | 'ended'
    created_at: string
    updated_at: string
}

export interface Chapter {
    id: string
    book_id: string
    author_id: string
    chapter_number: number
    audio_path: string | null
    duration_seconds: number | null
    transcript_original: string | null
    transcript_cleaned: string | null
    transcript_status: 'pending' | 'processing' | 'ready'
    created_at: string
}

export interface Rewrite {
    id: string
    chapter_id: string | null
    book_id: string
    scope: 'chapter' | 'book'
    model_used: string
    content: string
    created_at: string
}

export interface IllustratedBook {
    id: string
    book_id: string
    stripe_payment_intent_id: string
    status: 'pending_payment' | 'generating' | 'complete' | 'failed'
    pdf_path: string | null
    download_url: string | null
    download_url_expires_at: string | null
    created_at: string
}

export interface AdminConfig {
    id: number
    rewrite_model: string
    plot_model: string
    image_style: string
    plot_tone: string
    plot_max_bullets: number
    creativity_level: number
    updated_at: string
}

export const DEFAULT_RECORDING_QUOTA_SECONDS = 1800 // 30 minutes

export function isAtRecordingLimit(totalSeconds: number, subscriptionStatus: string, quotaSeconds: number = DEFAULT_RECORDING_QUOTA_SECONDS): boolean {
    return totalSeconds >= quotaSeconds && subscriptionStatus !== 'active'
}
