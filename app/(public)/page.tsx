import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { APP_VERSION } from '@/lib/version'

export default async function PublicHomePage() {
    let isLoggedIn = false
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        isLoggedIn = !!user
    } catch { }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Hero */}
            <section style={{
                background: 'linear-gradient(165deg, #1a0f2e 0%, #2d1f4e 35%, #4c1d95 70%, #7c5cbf 100%)',
                padding: '0 24px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -100, right: -100,
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(192,132,252,0.15), transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: -80,
                    width: 300, height: 300, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)',
                }} />

                {/* Nav */}
                <nav style={{
                    maxWidth: 1100, margin: '0 auto', padding: '20px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    position: 'relative', zIndex: 2,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Image src="/logo.png" alt="Popping Time" width={52} height={52} style={{ borderRadius: 10 }} />
                        <span style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 26, fontWeight: 700, color: 'white',
                        }}>Popping Time</span>
                    </div>
                    <Link
                        href={isLoggedIn ? '/dashboard' : '/login'}
                        className="btn-primary"
                        style={{ padding: '10px 24px', fontSize: 14 }}
                    >
                        {isLoggedIn ? 'Open App →' : 'Sign In'}
                    </Link>
                </nav>

                {/* Hero content */}
                <div style={{
                    maxWidth: 700, margin: '0 auto', textAlign: 'center',
                    padding: '80px 0 100px', position: 'relative', zIndex: 2,
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
                        borderRadius: 40, padding: '8px 18px', marginBottom: 28,
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <span style={{ fontSize: 14 }}>🌙</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500 }}>
                            Bedtime stories, reimagined
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800,
                        color: 'white', lineHeight: 1.15, marginBottom: 20,
                    }}>
                        Turn bedtime into<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #fde68a, #f59e0b)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>unforgettable stories</span>
                    </h1>

                    <p style={{
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: 'clamp(16px, 2vw, 19px)', lineHeight: 1.7,
                        maxWidth: 540, margin: '0 auto 40px',
                    }}>
                        Record the wild, wonderful stories you create with your children.
                        We&apos;ll help you turn them into beautiful illustrated books they&apos;ll treasure forever.
                    </p>

                    <Link href="/login" className="btn-primary" style={{
                        fontSize: 17, padding: '18px 36px',
                        boxShadow: '0 8px 32px rgba(124, 92, 191, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                    }}>
                        ✨ Start Your Story — Free
                    </Link>

                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 16 }}>
                        No credit card needed · 15 minutes free recording
                    </p>
                </div>
            </section>

            {/* 4 Key Values */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
                <p style={{
                    textAlign: 'center', fontSize: 13, fontWeight: 600,
                    color: 'var(--purple-mid)', letterSpacing: '2px',
                    textTransform: 'uppercase', marginBottom: 12,
                }}>Why families love it</p>
                <h2 style={{
                    textAlign: 'center', fontFamily: "'Outfit', sans-serif",
                    fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--purple-deep)',
                    fontWeight: 700, marginBottom: 56,
                }}>
                    Four reasons bedtime will never be the same
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 24,
                }}>
                    {/* Value 1 */}
                    <div className="card" style={{
                        padding: '32px 24px', textAlign: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f5f0ff, #e9d5ff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 28,
                        }}>💜</div>
                        <h3 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600,
                            color: 'var(--purple-deep)', marginBottom: 8,
                        }}>Build Shared Memories</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                            Turn five minutes at bedtime into stories they&apos;ll remember for life.
                        </p>
                    </div>

                    {/* Value 2 */}
                    <div className="card" style={{
                        padding: '32px 24px', textAlign: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 28,
                        }}>🚀</div>
                        <h3 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600,
                            color: 'var(--purple-deep)', marginBottom: 8,
                        }}>Grow Creativity & Communication</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                            Help kids think boldly, speak confidently, and imagine without limits.
                        </p>
                    </div>

                    {/* Value 3 */}
                    <div className="card" style={{
                        padding: '32px 24px', textAlign: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 28,
                        }}>🌙</div>
                        <h3 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600,
                            color: 'var(--purple-deep)', marginBottom: 8,
                        }}>Make Bedtime Fun Again</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                            Transform bedtime battles into &ldquo;what happens next?&rdquo; excitement.
                        </p>
                    </div>

                    {/* Value 4 */}
                    <div className="card" style={{
                        padding: '32px 24px', textAlign: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 28,
                        }}>📚</div>
                        <h3 style={{
                            fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600,
                            color: 'var(--purple-deep)', marginBottom: 8,
                        }}>Create Family Artifacts</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                            Turn fleeting moments into books your family can keep forever.
                        </p>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section style={{
                background: 'linear-gradient(180deg, var(--purple-pale), var(--cream))',
                padding: '80px 24px',
            }}>
                <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
                    <p style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)',
                        letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12,
                    }}>How it works</p>
                    <h2 style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 'clamp(24px, 3.5vw, 32px)', color: 'var(--purple-deep)',
                        fontWeight: 700, marginBottom: 48,
                    }}>Four simple steps</h2>

                    <div style={{ display: 'grid', gap: 20, textAlign: 'left' }}>
                        {[
                            { step: '1', emoji: '🌙', title: 'Tuck in & record', desc: 'Hit record and let your imagination run. 3 minutes or 15 — you choose.' },
                            { step: '2', emoji: '📝', title: 'We transcribe & clean up', desc: 'Whisper AI transcribes, Claude polishes. Your voice, better punctuated.' },
                            { step: '3', emoji: '📖', title: 'Build chapter by chapter', desc: 'Each night adds a new chapter. Watch the story grow over days and weeks.' },
                            { step: '4', emoji: '🎨', title: 'Create your illustrated book', desc: 'When finished, turn it into a beautiful PDF with AI-generated illustrations.' },
                        ].map((item) => (
                            <div key={item.step} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 20,
                                background: 'white', borderRadius: 'var(--radius)',
                                padding: '24px 28px', boxShadow: 'var(--shadow-soft)',
                                border: '1px solid var(--border)',
                            }}>
                                <div style={{
                                    minWidth: 48, height: 48, borderRadius: 12,
                                    background: 'linear-gradient(135deg, var(--purple-mid), var(--purple-light))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                                }}>{item.emoji}</div>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--purple-deep)', marginBottom: 4 }}>
                                        {item.title}
                                    </h3>
                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section style={{ maxWidth: 500, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
                <h2 style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700,
                    color: 'var(--purple-deep)', marginBottom: 12,
                }}>Simple, fair pricing</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                    Start free. Upgrade when you&apos;re hooked.
                </p>

                <div className="card" style={{ padding: '32px', marginBottom: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Free forever</p>
                    <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 4 }}>$0</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>15 minutes of recording</p>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'left' }}>
                        <p>✓ Unlimited chapters & stories</p>
                        <p>✓ AI transcription & cleanup</p>
                        <p>✓ Story sharing & gift links</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '32px', border: '2px solid var(--purple-mid)', position: 'relative' }}>
                    <span style={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--purple-mid)', color: 'white',
                        fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.5px',
                    }}>MOST POPULAR</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple-mid)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Unlimited</p>
                    <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 4 }}>
                        $1.99<span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>or $19.99/year (save 16%)</p>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'left' }}>
                        <p>✓ Everything in Free, plus:</p>
                        <p>✓ Unlimited recording time</p>
                        <p>✓ AI story rewrites</p>
                        <p>✓ Plot generator</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', marginTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Illustrated Book</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--purple-deep)' }}>
                        $9.99 <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>per book</span>
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>One-time · AI illustrations · PDF download</p>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{
                background: 'linear-gradient(135deg, #2d1f4e, #4c1d95)',
                padding: '80px 24px', textAlign: 'center',
            }}>
                <h2 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700,
                    color: 'white', marginBottom: 16,
                }}>
                    Tonight&apos;s bedtime could become tomorrow&apos;s book
                </h2>
                <p style={{
                    color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6,
                    maxWidth: 480, margin: '0 auto 32px',
                }}>
                    Start recording for free. No downloads, no installs.
                </p>
                <Link href="/login" className="btn-primary" style={{
                    fontSize: 17, padding: '18px 36px',
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                }}>
                    ✨ Create Your First Story
                </Link>
            </section>

            {/* Footer */}
            <footer style={{
                maxWidth: 1100, margin: '0 auto', padding: '40px 24px 32px',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 20,
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Image src="/logo.png" alt="Popping Time" width={32} height={32} style={{ borderRadius: 6 }} />
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--purple-deep)' }}>
                            Popping Time
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <Link href="/about" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>About</Link>
                        <Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Terms of Use</Link>
                        <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>Privacy Policy</Link>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
                        © {new Date().getFullYear()} Popping Time. All rights reserved.
                    </p>
                </div>

                {/* Admin link + version */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, opacity: 0.5 }}>{APP_VERSION}</span>
                    <Link
                        href="/admin/login"
                        style={{
                            color: 'var(--purple-mid)', fontSize: 13, fontWeight: 500, textDecoration: 'none',
                        }}
                    >
                        Admin Login
                    </Link>
                </div>
            </footer>
        </div>
    )
}
