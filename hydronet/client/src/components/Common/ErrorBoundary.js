import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💧</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem', color: 'var(--color-rose)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/map'}
            >
              Go to Map
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
