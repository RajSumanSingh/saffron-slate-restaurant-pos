
"use client";

import type { FormEvent } from "react";

type LoginScreenProps = {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function LoginScreen({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <main className="auth-screen">
      <section className="auth-brand-panel">
        <div className="auth-brand-mark">S.</div>

        <div className="auth-brand-copy">
          <div className="eyebrow">SAFFRON &amp; SLATE</div>
          <h1>Thoughtful service starts here.</h1>
          <p>
            A considered space for managing your menu,
            orders, and restaurant operations.
          </p>
        </div>

        <div className="auth-brand-footer">
          RESTAURANT OPERATIONS
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <h2>Welcome back.</h2>
          <p className="auth-subtitle">
            Sign in with your restaurant account.
          </p>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@restaurant.com"
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter your password"
            />

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="auth-notice">
            Authorized restaurant staff only.
          </p>
        </div>
      </section>
    </main>
  );
}
