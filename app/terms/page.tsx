import Link from 'next/link'

export const metadata = {
    title: 'Terms of Use — Popping Time',
    description: 'Terms of Use for Popping Time',
}

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #2d1f4e, #4c1d95)',
                padding: '48px 24px 40px',
                textAlign: 'center',
            }}>
                <Link href="/home" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
                    ← Back to home
                </Link>
                <h1 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    color: 'white',
                    marginTop: 12,
                }}>Terms of Use</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>
                    Last updated: February 2026
                </p>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>
                <div className="card" style={{ padding: '40px 36px' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.8 }}>
                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12, marginTop: 0 }}>1. Acceptance of Terms</h2>
                        <p style={{ marginBottom: 20 }}>
                            By accessing or using Popping Time (&ldquo;the Service&rdquo;), operated by Popping Time Pte. Ltd., you agree to be bound by these Terms of Use. If you do not agree to all the terms, please do not use the Service.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>2. Service Description</h2>
                        <p style={{ marginBottom: 20 }}>
                            Popping Time is a web application that enables users to record, transcribe, and transform bedtime stories into illustrated digital books using AI technology. The Service includes voice recording, AI-powered transcription and rewriting, story illustration, and PDF generation.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>3. User Accounts</h2>
                        <p style={{ marginBottom: 20 }}>
                            You must provide a valid email address to create an account. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You must be at least 18 years old to create an account. Children should only use the Service under adult supervision.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>4. Content Ownership</h2>
                        <p style={{ marginBottom: 20 }}>
                            You retain full ownership of all content you create, including audio recordings, transcripts, and story text. By using the Service, you grant us a limited license to process your content solely for the purpose of providing the Service (transcription, AI rewriting, illustration generation, and PDF creation). We will never sell, share, or use your content for purposes other than delivering the Service to you.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>5. AI-Generated Content</h2>
                        <p style={{ marginBottom: 20 }}>
                            The Service uses artificial intelligence to transcribe audio, rewrite text, generate story plots, and create illustrations. AI-generated content is provided &ldquo;as-is&rdquo; and may contain inaccuracies. You are responsible for reviewing all AI-generated content before sharing or publishing it.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>6. Payments and Subscriptions</h2>
                        <p style={{ marginBottom: 20 }}>
                            Free accounts include 15 minutes of recording time. Paid subscriptions unlock unlimited recording and additional features. Subscriptions are billed monthly or annually as selected. You may cancel your subscription at any time; access continues until the end of the billing period. Illustrated book purchases are one-time payments and are non-refundable once generation has begun.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>7. Acceptable Use</h2>
                        <p style={{ marginBottom: 20 }}>
                            You agree not to use the Service for any unlawful purpose, to upload harmful or inappropriate content, to attempt to interfere with the Service&apos;s infrastructure, or to access accounts belonging to other users.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>8. Termination</h2>
                        <p style={{ marginBottom: 20 }}>
                            We may suspend or terminate your account if you violate these Terms. You may delete your account at any time by contacting us. Upon termination, your data will be deleted within 30 days, except as required by law.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>9. Limitation of Liability</h2>
                        <p style={{ marginBottom: 20 }}>
                            The Service is provided &ldquo;as is&rdquo; without warranty of any kind. To the maximum extent permitted by law, Popping Time shall not be liable for any indirect, incidental, or consequential damages arising from the use of the Service.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>10. Changes to Terms</h2>
                        <p style={{ marginBottom: 20 }}>
                            We may update these Terms from time to time. We will notify you of significant changes via email. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>11. Contact</h2>
                        <p>
                            For questions about these Terms, contact us at <a href="mailto:hello@poppingtime.com" style={{ color: 'var(--purple-mid)' }}>hello@poppingtime.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
