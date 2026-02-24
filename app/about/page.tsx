import Link from 'next/link'

export const metadata = {
    title: 'About Us — Popping Time',
    description: 'The story behind Popping Time',
}

export default function AboutPage() {
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
                }}>About Us</h1>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>
                <div className="card" style={{ padding: '44px 36px' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 16, lineHeight: 1.9 }}>
                        <p style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 22,
                            fontWeight: 600,
                            color: 'var(--purple-deep)',
                            marginBottom: 24,
                            lineHeight: 1.5,
                        }}>
                            We believe every bedtime story is worth keeping.
                        </p>

                        <p style={{ marginBottom: 20 }}>
                            Popping Time was born from a simple observation: the best stories children ever hear aren&apos;t in books — they&apos;re the wild, improvised, sometimes absurd tales their parents make up at bedtime. Stories with dragons who can&apos;t stop sneezing, princesses who&apos;d rather be plumbers, and heroes who save the day by being kind.
                        </p>

                        <p style={{ marginBottom: 20 }}>
                            These stories are magical. And they disappear the moment the lights go out.
                        </p>

                        <p style={{ marginBottom: 20 }}>
                            We built Popping Time to capture these moments. Not perfectly — we don&apos;t want to replace the warmth of a parent&apos;s voice with polished prose. We just want to help families hold onto the creativity, the laughter, and the love that bedtime stories create.
                        </p>

                        <div style={{
                            background: 'var(--purple-pale)',
                            borderRadius: 'var(--radius)',
                            padding: '28px 32px',
                            margin: '32px 0',
                            borderLeft: '4px solid var(--purple-mid)',
                        }}>
                            <p style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 18,
                                fontStyle: 'italic',
                                color: 'var(--purple-deep)',
                                lineHeight: 1.6,
                            }}>
                                &ldquo;The stories we make up together — those are the real treasures. We just help you keep them.&rdquo;
                            </p>
                        </div>

                        <h2 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 20,
                            color: 'var(--purple-deep)',
                            marginBottom: 12,
                            marginTop: 32,
                        }}>How it works</h2>

                        <p style={{ marginBottom: 20 }}>
                            Record your bedtime stories using your phone or computer. Our AI (powered by the latest models from OpenAI, Anthropic, and Google) transcribes your stories, cleans them up, and when you&apos;re ready, can help rewrite them into polished children&apos;s prose — always keeping your original plot and characters.
                        </p>

                        <p style={{ marginBottom: 20 }}>
                            When your story is complete, turn it into a beautiful illustrated PDF with AI-generated artwork. A digital heirloom you can share with grandparents, print for the bookshelf, or save for the day your child has children of their own.
                        </p>

                        <h2 style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 20,
                            color: 'var(--purple-deep)',
                            marginBottom: 12,
                            marginTop: 32,
                        }}>Our values</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { emoji: '👨‍👩‍👧‍👦', title: 'Family first', desc: 'We build for parents and children. Everything we do serves the ritual of bedtime.' },
                                { emoji: '🔒', title: 'Privacy by design', desc: 'Your stories are yours. We never sell, share, or train on your content.' },
                                { emoji: '✨', title: 'Enhancement, not replacement', desc: 'AI helps polish your words, never replaces your voice or creativity.' },
                                { emoji: '🌱', title: 'Sustainable simplicity', desc: 'Fair pricing, no dark patterns, no surveillance. Just a tool that respects your family.' },
                            ].map((v) => (
                                <div key={v.title} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 16,
                                }}>
                                    <span style={{ fontSize: 24, lineHeight: 1.8 }}>{v.emoji}</span>
                                    <div>
                                        <p style={{ fontWeight: 600, color: 'var(--purple-deep)', marginBottom: 2 }}>{v.title}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{v.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            textAlign: 'center',
                            marginTop: 40,
                            padding: '32px 20px',
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            borderRadius: 'var(--radius)',
                        }}>
                            <p style={{ fontSize: 15, color: 'var(--purple-deep)', fontWeight: 500, marginBottom: 16 }}>
                                Questions? We&apos;d love to hear from you.
                            </p>
                            <a href="mailto:hello@poppingtime.com" className="btn-primary" style={{ fontSize: 14 }}>
                                ✉️ hello@poppingtime.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
