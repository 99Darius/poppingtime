'use client'

import { useState, useEffect } from 'react'
import type { AdminConfig } from '@/lib/types'

export default function AdminPage() {
    const [config, setConfig] = useState<AdminConfig | null>(null)
    const [users, setUsers] = useState<any[]>([])
    const [tab, setTab] = useState<'models' | 'users'>('models')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/config').then(r => r.json()).then(setConfig)
        fetch('/api/admin/users').then(r => r.json()).then(setUsers)
    }, [])

    async function saveConfig() {
        if (!config) return
        setSaving(true)
        await fetch('/api/admin/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rewrite_model: config.rewrite_model,
                plot_model: config.plot_model,
                image_style: config.image_style,
                plot_tone: config.plot_tone,
                plot_max_bullets: config.plot_max_bullets,
                creativity_level: config.creativity_level,
            }),
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    if (!config) {
        return (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
            </div>
        )
    }

    const totalRecordingMinutes = users.reduce((sum: number, u: any) => sum + (u.total_recording_seconds || 0), 0) / 60
    const activeSubscribers = users.filter((u: any) => u.subscription_status === 'active').length

    return (
        <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #2d1f4e, #4c1d95)',
                padding: '32px 24px 16px',
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <a href="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>← Back to app</a>
                        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
                    </nav>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Users', value: users.length },
                            { label: 'Subscribers', value: activeSubscribers },
                            { label: 'Total Rec. Min', value: Math.round(totalRecordingMinutes) },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 10,
                                padding: '12px 20px',
                                minWidth: 100,
                            }}>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}>{s.label}</p>
                                <p style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 20 }}>
                        {(['models', 'users'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    background: tab === t ? 'white' : 'rgba(255,255,255,0.1)',
                                    color: tab === t ? 'var(--purple-deep)' : 'rgba(255,255,255,0.7)',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px 8px 0 0',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: "'Outfit', sans-serif",
                                    textTransform: 'capitalize',
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
                {tab === 'models' && (
                    <div className="card fade-in" style={{ padding: 28 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--purple-deep)' }}>
                            AI Configuration
                        </h2>

                        <div style={{ display: 'grid', gap: 20 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Rewrite Model
                                </label>
                                <select
                                    className="input"
                                    value={config.rewrite_model}
                                    onChange={e => setConfig({ ...config, rewrite_model: e.target.value })}
                                >
                                    <option value="claude-opus-4-5">Claude Opus</option>
                                    <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
                                    <option value="claude-haiku-4-5">Claude Haiku</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Plot Generation Model
                                </label>
                                <select
                                    className="input"
                                    value={config.plot_model}
                                    onChange={e => setConfig({ ...config, plot_model: e.target.value })}
                                >
                                    <option value="claude-opus-4-5">Claude Opus</option>
                                    <option value="claude-sonnet-4-20250514">Claude Sonnet</option>
                                    <option value="claude-haiku-4-5">Claude Haiku</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Image Style Prompt
                                </label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={config.image_style}
                                    onChange={e => setConfig({ ...config, image_style: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Plot Tone
                                </label>
                                <select
                                    className="input"
                                    value={config.plot_tone}
                                    onChange={e => setConfig({ ...config, plot_tone: e.target.value })}
                                >
                                    <option value="funny">Funny</option>
                                    <option value="adventurous">Adventurous</option>
                                    <option value="magical">Magical</option>
                                    <option value="silly">Silly</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                        Max Plot Bullets
                                    </label>
                                    <input
                                        className="input"
                                        type="number"
                                        min={3}
                                        max={7}
                                        value={config.plot_max_bullets}
                                        onChange={e => setConfig({ ...config, plot_max_bullets: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                        Creativity Level
                                    </label>
                                    <input
                                        className="input"
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={config.creativity_level}
                                        onChange={e => setConfig({ ...config, creativity_level: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={saveConfig} disabled={saving} className="btn-primary">
                                {saving ? <><span className="spinner" /> Saving...</> : 'Save Configuration'}
                            </button>
                            {saved && <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>✓ Saved</span>}
                        </div>
                    </div>
                )}

                {tab === 'users' && (
                    <div className="card fade-in" style={{ overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    {['Email', 'Status', 'Recording', 'PDFs', 'Joined', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{u.email}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span className={`badge ${u.subscription_status === 'active' ? 'badge-ready' : 'badge-pending'}`}>
                                                {u.subscription_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                            {Math.round((u.total_recording_seconds || 0) / 60)} / {Math.round((u.recording_quota_seconds || 1800) / 60)} min
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {u.free_pdf_credits || 0}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={async () => {
                                                    await fetch('/api/admin/users', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: u.id, add_minutes: 30 })
                                                    })
                                                    fetch('/api/admin/users').then(r => r.json()).then(setUsers)
                                                }}
                                                className="btn-ghost"
                                                style={{ fontSize: 11, padding: '4px 8px' }}
                                                title="Add 30 Minutes"
                                            >
                                                +30 Min
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    await fetch('/api/admin/users', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: u.id, add_pdf: true })
                                                    })
                                                    fetch('/api/admin/users').then(r => r.json()).then(setUsers)
                                                }}
                                                className="btn-ghost"
                                                style={{ fontSize: 11, padding: '4px 8px' }}
                                                title="Add 1 PDF Generation Credit"
                                            >
                                                +1 PDF
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    await fetch('/api/admin/users', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ id: u.id, toggle_sub: true })
                                                    })
                                                    fetch('/api/admin/users').then(r => r.json()).then(setUsers)
                                                }}
                                                style={{
                                                    fontSize: 11, padding: '4px 8px',
                                                    background: 'transparent',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: 6, cursor: 'pointer'
                                                }}
                                                title="Toggle Sub"
                                            >
                                                Toggle Sub
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
