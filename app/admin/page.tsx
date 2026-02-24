'use client'

import { useState, useEffect } from 'react'
import type { AdminConfig } from '@/lib/types'

const defaultRewritePrompt = `You are an editor. Your ONLY job is to clean up a voice-recorded transcript. Fix obvious speech recognition errors, spelling, and grammar. Do NOT change the sentence structure, length, meaning, creativity, or voice. Let the user keep the exact essence of what they recorded.`

const defaultPlotPrompt = `Generate a children's bedtime story outline for ages 8-12. Be creative, playful, and imaginative. Keep it child-appropriate. Use easy-to-understand words.
CRITICAL RULES:
1. Every single aspect (hook, problem, action, climax, resolution) MUST be strictly LESS THAN 10 WORDS. Get straight to the key points and core actions. Do NOT use descriptive filler.
2. Ensure the ideas are strictly kid-friendly and concrete. Do NOT use complex adult metaphors (like paying rent, taxes, or repossessing things).
3. If introducing weird, magical, or wacky concepts, limit them to a MAXIMUM of 1 or 2 total weird ideas so the story remains easy to follow. Make sure those ideas are easily understandable.
4. The requested Characters MUST be directly linked to and suitable for the plot you generated. They must make sense in this world.

Return a valid JSON object with EXACTLY this structure:
{
  "title": "A fun, catchy title for the story",
  "hook": "Intriguing premise (max 10 words)",
  "problem": "Main conflict (max 10 words)",
  "action": ["obstacle 1 (max 10 words)", "obstacle 2 (max 10 words)", "obstacle 3 (max 10 words)"] (up to 5 bullets),
  "climax": "Biggest challenge (max 10 words)",
  "resolution": "How it all ends (1 sentence)",
  "characters": {
    "protagonist": "Name — one-line fun description matching the plot",
    "companion": "Name — one-line fun description matching the plot",
    "mentor": "Name — one-line fun description matching the plot",
    "antagonist": "Name — one-line fun description matching the plot"
  }
}`

const defaultImagePrompt = `watercolor illustration, children's book style. Children's book illustration for chapter {{chapterNumber}}. Scene: {{sceneText}}. Warm, inviting, age-appropriate for 8-12 year olds. No text in image.`

export default function AdminPage() {
    const [config, setConfig] = useState<AdminConfig | null>(null)
    const [history, setHistory] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [tab, setTab] = useState<'models' | 'users' | 'analytics' | 'logs'>('models')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/config').then(r => r.json()).then(setConfig)
        fetch('/api/admin/config/history').then(r => r.json()).then(setHistory)
        fetch('/api/admin/users').then(r => r.json()).then(setUsers)
        fetch('/api/admin/analytics').then(r => r.json()).then(setStats)
        fetch('/api/admin/logs').then(r => r.json()).then(setLogs)
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
                image_model: config.image_model,
                image_style: config.image_style,
                plot_tone: config.plot_tone,
                plot_max_bullets: config.plot_max_bullets,
                creativity_level: config.creativity_level,
            }),
        })
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        fetch('/api/admin/config/history').then(r => r.json()).then(setHistory)
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
                        {(['models', 'users', 'analytics', 'logs'] as const).map(t => (
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
                                    <optgroup label="Anthropic Claude">
                                        <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                                        <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
                                        <option value="claude-3-opus-latest">Claude 3 Opus</option>
                                    </optgroup>

                                    <optgroup label="OpenAI ChatGPT">
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="o1">o1</option>
                                        <option value="o1-mini">o1-mini</option>
                                        <option value="o3-mini">o3-mini</option>
                                    </optgroup>

                                    <optgroup label="Google Gemini">
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</option>
                                    </optgroup>
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
                                    <optgroup label="Anthropic Claude">
                                        <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet</option>
                                        <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku</option>
                                        <option value="claude-3-opus-latest">Claude 3 Opus</option>
                                    </optgroup>

                                    <optgroup label="OpenAI ChatGPT">
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="o1">o1</option>
                                        <option value="o1-mini">o1-mini</option>
                                        <option value="o3-mini">o3-mini</option>
                                    </optgroup>

                                    <optgroup label="Google Gemini">
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                                        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Image Generation Model
                                </label>
                                <select
                                    className="input"
                                    value={config.image_model}
                                    onChange={e => setConfig({ ...config, image_model: e.target.value })}
                                >
                                    <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview</option>
                                    <option value="dall-e-3">DALL-E 3</option>
                                </select>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Rewrite Prompt Template
                                </label>
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={config.rewrite_prompt || defaultRewritePrompt}
                                    onChange={e => setConfig({ ...config, rewrite_prompt: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Plot Prompt Template
                                </label>
                                <textarea
                                    className="input"
                                    rows={10}
                                    value={config.plot_prompt || defaultPlotPrompt}
                                    onChange={e => setConfig({ ...config, plot_prompt: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                                    Image Generation Prompt Template (Variables: {'{{chapterNumber}}'}, {'{{sceneText}}'})
                                </label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={config.image_style || defaultImagePrompt}
                                    onChange={e => setConfig({ ...config, image_style: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={saveConfig} disabled={saving} className="btn-primary">
                                {saving ? <><span className="spinner" /> Saving...</> : 'Save Configuration'}
                            </button>
                            {saved && <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>✓ Saved</span>}
                        </div>

                        <div style={{ marginTop: 40 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Configuration History</h3>
                            {history.length > 0 ? (
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {history.map(h => (
                                        <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)' }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {new Date(h.created_at).toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => setConfig({ ...h.config_snapshot, updated_at: h.created_at, id: config.id })}
                                                className="btn-secondary"
                                                style={{ fontSize: 12, padding: '6px 14px' }}
                                                disabled={saving}
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No history available yet.</p>
                            )}
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

                {tab === 'analytics' && stats && (
                    <div className="card fade-in" style={{ padding: 28 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Analytics Dashboard</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            <div style={{ padding: 20, background: 'var(--purple-pale)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: 'var(--purple-deep)', fontWeight: 600, marginBottom: 4 }}>Total Active Users</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalUsers}</p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#047857', fontWeight: 600, marginBottom: 4 }}>Total Books Created</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalBooks}</p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#b45309', fontWeight: 600, marginBottom: 4 }}>Books Created (Last 7 Days)</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.recentBooks}</p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, marginBottom: 4 }}>Total PDF Generations</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalPdfs}</p>
                            </div>

                            <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>Total AI Audio Processing</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalRecordingMinutes} <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>min</span></p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#6d28d9', fontWeight: 600, marginBottom: 4 }}>Total AI Tokens (Text)</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{(stats.totalTokens || 0).toLocaleString()}</p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#be185d', fontWeight: 600, marginBottom: 4 }}>Total AI Images</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>{(stats.totalImages || 0).toLocaleString()}</p>
                            </div>

                            <div style={{ padding: 20, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12 }}>
                                <p style={{ fontSize: 13, color: '#047857', fontWeight: 600, marginBottom: 4 }}>Est API Cost</p>
                                <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>${stats.estimatedCost || '0.00'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'logs' && (
                    <div className="card fade-in" style={{ padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>System Logs</h2>
                            <button onClick={() => fetch('/api/admin/logs').then(r => r.json()).then(setLogs)} className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }}>
                                Refresh
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Timestamp</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Event</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>User ID</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Message / Metadata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(logs) ? logs.map((log: any) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', fontFamily: 'monospace' }}>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span className="badge badge-ready">{log.event_type}</span>
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: 11 }}>{log.user_id || 'System'}</td>
                                            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                                                {log.message}
                                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                    <pre style={{ marginTop: 4, padding: 8, background: 'rgba(0,0,0,0.03)', borderRadius: 4, fontSize: 11 }}>
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'red' }}>
                                                Failed to load logs. {(logs as any)?.error || ''}
                                            </td>
                                        </tr>
                                    )}
                                    {Array.isArray(logs) && logs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No logs recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
