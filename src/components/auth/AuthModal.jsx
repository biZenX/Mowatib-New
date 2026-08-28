import React, { useState, useEffect } from 'react';
import { i18n } from '../../services/i18n.js';
import { authService, isSupabaseConfigured } from '../../services/supabase.js';

export function AuthModal({ onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authService.getUser().then(u => setUser(u));
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { user: signedInUser, error } = await authService.signInWithGoogle();
    setLoading(false);
    if (signedInUser) {
      setUser(signedInUser);
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <div class="m3-modal-backdrop" onClick={onClose}>
      <div class="m3-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span class="material-symbols-rounded" style={{ fontSize: '28px', color: 'var(--m3-primary)' }}>account_circle</span>
            <h2 class="modal-title">{i18n.t('account')}</h2>
          </div>
          <button class="m3-action-btn" onClick={onClose}>
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <div class="modal-body">
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--m3-primary-container)', color: 'var(--m3-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '28px', fontWeight: '800' }}>
                {user.email ? user.email.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                  {user.user_metadata?.full_name || 'طالب مواظب (Student)'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--m3-text-secondary)', marginTop: '0.1rem' }}>
                  {user.email || 'student@mowatib.app'}
                </div>
              </div>

              {!isSupabaseConfigured && (
                <div style={{ background: 'var(--m3-surface-container)', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--m3-text-muted)' }}>
                  وضع التطوير التجريبي المحلي (Local Demo Mode)
                </div>
              )}

              <button class="m3-btn-danger" style={{ marginTop: '0.5rem' }} onClick={handleSignOut}>
                {i18n.t('sign_out')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '0.92rem', color: 'var(--m3-text-secondary)' }}>
                سجل الدخول لحفظ ومزامنة مهامك وجداولك وملاحظاتك الدراسية عبر السحابة.
              </p>

              <button
                class="m3-btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{i18n.t('sign_in_google')}</span>
              </button>
            </div>
          )}
        </div>

        <div class="modal-actions-row">
          <button class="m3-btn-secondary" onClick={onClose}>
            {i18n.t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
