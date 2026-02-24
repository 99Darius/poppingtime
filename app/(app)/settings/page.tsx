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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [displayName, setDisplayName] = useState('')
    const [childName, setChildName] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [coauthors, setCoauthors] = useState<{ id: string, email: string, displayName: string }[]>([])

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || '')
                setDisplayName(user.user_metadata?.display_name || '')
                setChildName(user.user_metadata?.child_name || '')

                const res = await fetch('/api/settings/coauthors')
                if (res.ok) {
                    const data = await res.json()
                    setCoauthors(data.coauthors || [])
                }
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

            // Update co-authors
            for (const c of coauthors) {
                await fetch('/api/settings/coauthors', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coauthorId: c.id, displayName: c.displayName })
                })
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

    async function handleDeleteAccount() {
        setDeleting(true)
        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete account')

            // Log out and redirect
            await supabase.auth.signOut()
            window.location.href = '/'
        } catch (error: any) {
            alert(error.message)
            setDeleting(false)
            setShowDeleteConfirm(false)
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

                    {coauthors.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Co-Authors</h3>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -10 }}>
                                Update the display names of people you have invited to co-author your books.
                            </p>
                            {coauthors.map((c, idx) => (
                                <div key={c.id}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                        {c.email}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Co-author's display name (e.g. Grandma, Uncle Joe)"
                                        value={c.displayName}
                                        onChange={(e) => {
                                            const newCoauthors = [...coauthors]
                                            newCoauthors[idx].displayName = e.target.value
                                            setCoauthors(newCoauthors)
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

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

            {/* Danger Zone */}
            <div className="card" style={{ padding: 32, marginTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="btn-secondary"
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                    🗑 Delete Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card slide-up" style={{ padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>
                            Delete Account?
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                            Are you absolutely sure? This will permanently delete your account, your profile, your stories, and any co-author access you have. <strong style={{ color: '#000' }}>This action cannot be undone.</strong>
                        </p>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                className="btn-primary"
                                style={{ flex: 1, justifyContent: 'center', background: '#ef4444' }}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete Hub'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
