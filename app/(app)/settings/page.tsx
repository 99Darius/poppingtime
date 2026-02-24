'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const [displayName, setDisplayName] = useState('')
    const [childName, setChildName] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || '')
                setDisplayName(user.user_metadata?.display_name || '')
                setChildName(user.user_metadata?.child_name || '')
            }
            setLoading(false)
        }
        loadUser()
    }, [])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setStatus('idle')
        setErrorMessage('')

        try {
            // Update metadata
            const { error: metaError } = await supabase.auth.updateUser({
                data: {
                    display_name: displayName,
                    child_name: childName,
                }
            })

            if (metaError) throw metaError

            // Update password if provided
            if (password) {
                const { error: passError } = await supabase.auth.updateUser({
                    password
                })
                if (passError) throw passError
                setPassword('') // Clear password field on success
            }

            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)
        } catch (error: any) {
            setStatus('error')
            setErrorMessage(error.message || 'Failed to update settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
        )
    }

    return (
        <div className="fade-in" style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
            <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--purple-deep)', marginBottom: 24 }}>
                Settings
            </h1>

            <div className="card" style={{ padding: 32 }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            disabled
                            style={{ background: 'var(--cream)', color: 'var(--text-muted)' }}
                        />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            Email cannot be changed directly.
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            Your Name (Author)
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Daddy, Mommy, or your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            Child's Name
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Your child's name"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                        />
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            This will be featured in your generated PDF books.
                        </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            New Password (Optional)
                        </label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Leave blank to keep current"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 24px', flex: 1, justifyContent: 'center' }}>
                            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Save Settings'}
                        </button>
                    </div>

                    {status === 'success' && (
                        <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                            ✓ Settings saved successfully!
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: 'center' }}>
                            {errorMessage}
                        </div>
                    )}

                </form>
            </div>
        </div>
    )
}
