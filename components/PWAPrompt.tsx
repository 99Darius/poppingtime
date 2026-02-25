'use client'

import { useState, useEffect } from 'react'

export default function PWAPrompt({ hasBooks }: { hasBooks: boolean }) {
    const [show, setShow] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Only show if the user has uploaded at least 1 chapter/book
        if (!hasBooks) return

        // Prevent showing multiple times if dismissed
        if (localStorage.getItem('dismissed_pwa_prompt')) return

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone

        // If not already installed as an app
        if (!isStandalone) {
            setIsIOS(isIosDevice)
            // Wait 2 seconds before popping it up so it's not jarring
            const timer = setTimeout(() => setShow(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [hasBooks])

    if (!show) return null

    return (
        <div className="slide-up" style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)',
            maxWidth: 400,
            background: 'white',
            borderRadius: 'var(--radius)',
            padding: 20,
            boxShadow: '0 12px 40px rgba(45, 31, 78, 0.2), 0 0 0 1px var(--border)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src="/logo.png" style={{ width: 48, height: 48, borderRadius: 12, border: '1px solid var(--border)' }} alt="App Icon" />
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--purple-deep)', margin: 0 }}>Install Popping Time</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Save to home screen for 1-tap fast access</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        localStorage.setItem('dismissed_pwa_prompt', 'true')
                        setShow(false)
                    }}
                    style={{ background: 'transparent', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                    ✕
                </button>
            </div>

            <div style={{ background: 'var(--cream)', padding: 12, borderRadius: 8, fontSize: 14, color: 'var(--text-primary)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                {isIOS ? (
                    <>Tap the <b>Share</b> icon at the bottom of your screen, then scroll down and tap <b>Add to Home Screen</b>.</>
                ) : (
                    <>Tap the <b>Menu (⋮)</b> icon in your browser, then select <b>Add to Home screen</b> or <b>Install app</b>.</>
                )}
            </div>
        </div>
    )
}
