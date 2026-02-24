import Link from 'next/link'

export const metadata = {
    title: 'Privacy Policy — Popping Time',
    description: 'Privacy Policy for Popping Time — GDPR compliant',
}

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
            <div style={{
                background: 'linear-gradient(135deg, #2d1f4e, #4c1d95)',
                padding: '48px 24px 40px',
                textAlign: 'center',
            }}>
                <Link href="/home" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
                    ← Back to home
                </Link>
                <h1 style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 700,
                    color: 'white', marginTop: 12,
                }}>Privacy Policy</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8 }}>
                    Last updated: February 2026
                </p>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>
                <div className="card" style={{ padding: '40px 36px' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.8 }}>
                        <p style={{ marginBottom: 20 }}>
                            Popping Time (&ldquo;we&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal data in compliance with the General Data Protection Regulation (GDPR) and applicable data protection laws.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>1. Data Controller</h2>
                        <p style={{ marginBottom: 20 }}>
                            Popping Time Pte. Ltd. is the data controller for personal data collected through the Service. Contact: <a href="mailto:hello@poppingtime.com" style={{ color: 'var(--purple-mid)' }}>hello@poppingtime.com</a>.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>2. Data We Collect</h2>
                        <p style={{ marginBottom: 8 }}><strong>Account Data:</strong> Email address, display name (optional).</p>
                        <p style={{ marginBottom: 8 }}><strong>Content Data:</strong> Audio recordings, transcripts, story text, and generated illustrations — all created by you.</p>
                        <p style={{ marginBottom: 8 }}><strong>Payment Data:</strong> Processed securely by Stripe. We store only your Stripe customer ID and subscription status, never card details.</p>
                        <p style={{ marginBottom: 20 }}><strong>Usage Data:</strong> Recording duration, feature usage metrics, and session data for service improvement.</p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>3. Legal Basis for Processing</h2>
                        <p style={{ marginBottom: 8 }}>We process your data based on:</p>
                        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
                            <li><strong>Contract performance:</strong> To provide the Service you signed up for.</li>
                            <li><strong>Legitimate interest:</strong> To improve the Service and prevent fraud.</li>
                            <li><strong>Consent:</strong> For marketing emails (you can opt out at any time).</li>
                        </ul>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>4. How We Use Your Data</h2>
                        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
                            <li>To provide and maintain the Service</li>
                            <li>To process audio recordings through AI transcription (OpenAI Whisper)</li>
                            <li>To generate text rewrites (Anthropic Claude) and illustrations (Google Gemini)</li>
                            <li>To process payments through Stripe</li>
                            <li>To send transactional emails (chapter notifications, book completion)</li>
                            <li>To improve service quality and fix issues</li>
                        </ul>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>5. Third-Party Processors</h2>
                        <p style={{ marginBottom: 8 }}>We use the following third-party services to process your data:</p>
                        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
                            <li><strong>Supabase</strong> (database, authentication, file storage) — EU/US</li>
                            <li><strong>OpenAI</strong> (audio transcription) — US</li>
                            <li><strong>Anthropic</strong> (text processing) — US</li>
                            <li><strong>Google</strong> (illustration generation) — US</li>
                            <li><strong>Stripe</strong> (payment processing) — US/EU</li>
                            <li><strong>Resend</strong> (transactional email) — US</li>
                        </ul>
                        <p style={{ marginBottom: 20 }}>
                            All processors are bound by data processing agreements and maintain appropriate security measures.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>6. Data Retention</h2>
                        <p style={{ marginBottom: 20 }}>
                            We retain your account data and content for as long as your account is active. Audio recordings are retained until deleted by you. Upon account deletion, all data is permanently removed within 30 days. Payment records are retained as required by applicable tax and accounting laws.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>7. Your Rights (GDPR)</h2>
                        <p style={{ marginBottom: 8 }}>You have the right to:</p>
                        <ul style={{ paddingLeft: 24, marginBottom: 20 }}>
                            <li><strong>Access</strong> your personal data</li>
                            <li><strong>Rectify</strong> inaccurate personal data</li>
                            <li><strong>Erase</strong> your personal data (&ldquo;right to be forgotten&rdquo;)</li>
                            <li><strong>Restrict</strong> processing of your data</li>
                            <li><strong>Data portability</strong> — receive your data in a machine-readable format</li>
                            <li><strong>Object</strong> to processing based on legitimate interest</li>
                            <li><strong>Withdraw consent</strong> at any time</li>
                        </ul>
                        <p style={{ marginBottom: 20 }}>
                            To exercise any of these rights, contact us at <a href="mailto:hello@poppingtime.com" style={{ color: 'var(--purple-mid)' }}>hello@poppingtime.com</a>. We will respond within 30 days.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>8. Children&apos;s Privacy</h2>
                        <p style={{ marginBottom: 20 }}>
                            The Service is intended for parents and guardians. We do not knowingly collect personal data from children under 13. Audio recordings may contain children&apos;s voices recorded by their parent/guardian. Parents are responsible for the content they record and share.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>9. Security</h2>
                        <p style={{ marginBottom: 20 }}>
                            We implement appropriate technical and organisational measures to protect your data, including encryption in transit (TLS) and at rest, access controls, and regular security reviews. Audio files and PDFs are stored in private, access-controlled storage buckets.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>10. Cookies</h2>
                        <p style={{ marginBottom: 20 }}>
                            We use essential cookies for authentication and session management only. We do not use tracking or advertising cookies.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>11. Changes to This Policy</h2>
                        <p style={{ marginBottom: 20 }}>
                            We may update this policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via email before they take effect.
                        </p>

                        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, color: 'var(--purple-deep)', marginBottom: 12 }}>12. Contact & Complaints</h2>
                        <p>
                            For privacy inquiries or to file a complaint: <a href="mailto:hello@poppingtime.com" style={{ color: 'var(--purple-mid)' }}>hello@poppingtime.com</a>.
                            You also have the right to lodge a complaint with your local data protection authority.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
