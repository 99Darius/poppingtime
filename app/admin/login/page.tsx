'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Try bypass override
        try {
            const bypassRes = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            if (bypassRes.ok) {
                router.push('/admin')
                return
            }
        } catch { }

        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
        } else {
            router.push('/admin')
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a0f2e 0%, #2d1f4e 100%)' }}>
            <div className="card fade-in" style={{ padding: '40px', width: '100%', maxWidth: 400, background: 'white', borderRadius: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <Image src="/logo.png" alt="Popping Time" width={48} height={48} style={{ borderRadius: 12, marginBottom: 16 }} />
                    <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--purple-deep)' }}>
                        Admin Login
                    </h1>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</p>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Authenticating...</> : 'Log In via Password'}
                    </button>
                    <a href="/login" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12, display: 'block', textDecoration: 'none' }}>
                        Or use magic link
                    </a>
                </form>
            </div>
        </div>
    )
}
