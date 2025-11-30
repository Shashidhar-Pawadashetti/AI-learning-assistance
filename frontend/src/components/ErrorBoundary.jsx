import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'2rem',textAlign:'center',maxWidth:'600px',margin:'0 auto'}}>
          <h1>😕 Something went wrong</h1>
          <p style={{color:'#64748b',marginTop:'1rem'}}>
            We encountered an unexpected error. Please refresh the page or contact support if the problem persists.
          </p>
          <button 
            className="btn" 
            onClick={() => window.location.href = '/'}
            style={{marginTop:'1.5rem'}}
          >
            Go to Home
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{marginTop:'2rem',textAlign:'left',background:'#f8fafc',padding:'1rem',borderRadius:'8px'}}>
              <summary>Error Details (Dev Only)</summary>
              <pre style={{fontSize:'0.875rem',overflow:'auto'}}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
