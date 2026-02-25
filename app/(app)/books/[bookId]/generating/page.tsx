import Link from 'next/link'

export default function GeneratingPage() {
    return (
        <div className="fade-in card" style={{
            maxWidth: 500,
            margin: '60px auto',
            padding: '40px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24
        }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                <div className="spinner" style={{
                    width: '100%',
                    height: '100%',
                    borderWidth: 6,
                    borderColor: 'var(--purple-pale)',
                    borderTopColor: 'var(--purple-mid)',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }} />
                <span style={{
                    fontSize: 32,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                }}>🎨</span>
            </div>

            <div>
                <h1 className="serif" style={{ fontSize: 28, color: 'var(--purple-deep)', marginBottom: 12 }}>
                    Your book is being created!
                </h1>
                <p style={{
                    fontSize: 18,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    fontWeight: 500
                }}>
                    This may take 10 minutes or more. We are processing it and will email you when it's ready.
                </p>
                <div style={{
                    marginTop: 24,
                    padding: 16,
                    backgroundColor: 'var(--purple-light)',
                    borderRadius: 12,
                    color: 'var(--purple-deep)',
                    fontSize: 15,
                    lineHeight: 1.5
                }}>
                    You can safely navigate away from this page and continue making stories while you wait. We'll handle everything in the background.
                </div>
            </div>

            <Link
                href="/dashboard"
                className="btn-primary"
                style={{ marginTop: 8, padding: '12px 24px', fontSize: 16 }}
            >
                Return to Dashboard
            </Link>
        </div>
    )
}
