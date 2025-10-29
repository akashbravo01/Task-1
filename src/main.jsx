import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>⚠️ Something went wrong</h1>
            <p>We're sorry, but the application encountered an unexpected error.</p>
            <button onClick={this.handleReload} className="reload-button">
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


// Root component
const Root = () => (
  <ErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>
);

// Get root element
const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element. Make sure you have a div with id="root" in your index.html');
}

// Create root and render
const root = ReactDOM.createRoot(container);

// Render with error handling
try {
  root.render(<Root />);
  
  // Register service worker in production (optional)
  if (process.env.NODE_ENV === 'production') {
    registerServiceWorker();
  }
} catch (error) {
  console.error('Failed to render React application:', error);
  
  // Fallback rendering for critical errors
  container.innerHTML = `
    <div class="critical-error">
      <div>
        <h1>Critical Application Error</h1>
        <p>The application failed to load. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" class="reload-button">
          Reload Page
        </button>
      </div>
    </div>
  `;
}

// Hot Module Replacement for development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(<Root />);
  });
}

export default Root;