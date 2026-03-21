'use client'

import { useActionState, useState } from 'react'
import { signIn, signUp } from './actions'

type Tab = 'login' | 'signup'
type ActionState = { error?: string; success?: string } | null

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login')
  const [loginState, loginAction, loginPending] = useActionState<ActionState, FormData>(signIn, null)
  const [signupState, signupAction, signupPending] = useActionState<ActionState, FormData>(signUp, null)

  const isPending = loginPending || signupPending

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
      }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'var(--primary)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '1.8rem' }}>📖</span>
          </div>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.02em',
          }}>
            일본어 단어장
          </h1>
        </div>

        {/* 카드 */}
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '28px 24px',
          boxShadow: '0 2px 16px var(--shadow)',
        }}>
          {/* 탭 */}
          <div style={{
            display: 'flex',
            marginBottom: '24px',
            borderBottom: '2px solid var(--border)',
          }}>
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'none',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontSize: '0.95rem',
                  fontWeight: tab === t ? 700 : 400,
                  color: tab === t ? 'var(--primary)' : 'var(--text-sub)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* 로그인 폼 */}
          {tab === 'login' && (
            <form action={loginAction}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>이메일</label>
                <input
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>비밀번호</label>
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  required
                  style={inputStyle}
                />
              </div>
              {loginState?.error && <p style={errorStyle}>{loginState.error}</p>}
              <button type="submit" disabled={isPending} style={submitBtnStyle(isPending)}>
                {loginPending ? '로그인 중...' : '로그인'}
              </button>
            </form>
          )}

          {/* 회원가입 폼 */}
          {tab === 'signup' && (
            <form action={signupAction}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>이메일</label>
                <input
                  name="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>비밀번호 (6자 이상)</label>
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  required
                  minLength={6}
                  style={inputStyle}
                />
              </div>
              {signupState?.error && <p style={errorStyle}>{signupState.error}</p>}
              {signupState?.success && <p style={successStyle}>{signupState.success}</p>}
              <button type="submit" disabled={isPending} style={submitBtnStyle(isPending)}>
                {signupPending ? '가입 중...' : '회원가입'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-sub)',
  marginBottom: '6px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: 'var(--text)',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
}

const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '13px',
  background: disabled ? 'var(--primary-light)' : 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background 0.15s',
})

const errorStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#e53e3e',
  marginBottom: '12px',
  padding: '10px 12px',
  background: '#fff5f5',
  borderRadius: '8px',
  border: '1px solid #fed7d7',
}

const successStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#2d6a4f',
  marginBottom: '12px',
  padding: '10px 12px',
  background: '#f0fff4',
  borderRadius: '8px',
  border: '1px solid #c6f6d5',
}
