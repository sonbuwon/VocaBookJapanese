'use client'

interface HeaderProps {
  title: string
  showBack: boolean
  onBack: () => void
}

export default function Header({ title, showBack, onBack }: HeaderProps) {
  return (
    <header style={{
      width: '100%',
      background: 'var(--primary)',
      color: '#fff',
      padding: '18px 16px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      position: 'relative',
    }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          left: '14px',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '1.5rem',
          cursor: 'pointer',
          lineHeight: 1,
          padding: '4px 6px',
          borderRadius: '6px',
          visibility: showBack ? 'visible' : 'hidden',
        }}
      >
        ←
      </button>
      <h1 style={{
        flex: 1,
        fontSize: '1.15rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}>
        {title}
      </h1>
    </header>
  )
}
