import { useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const initialFormState = {
  name: '',
  email: '',
  password: '',
};

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState(initialFormState);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [products, setProducts] = useState([]);
  const [backendStatus, setBackendStatus] = useState({
    state: 'checking',
    text: 'Checking backend connection...',
  });
  const [feedback, setFeedback] = useState({
    type: 'info',
    text: 'Use this panel to create an account, sign in, and test protected routes.',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ping`);
        const text = await response.text();

        if (!response.ok || text.trim().toLowerCase() !== 'pong') {
          throw new Error('Backend did not respond correctly.');
        }

        setBackendStatus({
          state: 'online',
          text: 'Backend connected on localhost:8080',
        });
      } catch (error) {
        setBackendStatus({
          state: 'offline',
          text: 'Backend is not reachable. Start the server and try again.',
        });
      }
    };

    checkBackend();
  }, []);

  useEffect(() => {
    if (!token) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      setIsLoadingProducts(true);

      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to fetch protected products.');
        }

        setProducts(Array.isArray(data) ? data : []);
        setFeedback({
          type: 'success',
          text: 'Login successful. Protected data loaded from the backend.',
        });
      } catch (error) {
        setProducts([]);
        setFeedback({
          type: 'error',
          text: error.message || 'Unable to fetch protected products.',
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFeedback({
      type: 'info',
      text:
        tab === 'signup'
          ? 'New users will be saved directly in MongoDB through your backend.'
          : 'Sign in with an existing account to receive a JWT token.',
    });
    setFormData((current) => ({
      ...initialFormState,
      email: tab === 'login' ? current.email : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const endpoint = activeTab === 'signup' ? '/auth/signup' : '/auth/login';
    const payload =
      activeTab === 'signup'
        ? formData
        : { email: formData.email, password: formData.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const validationMessage = data?.error?.details?.[0]?.message;
        throw new Error(validationMessage || data.message || 'Request failed.');
      }

      if (activeTab === 'signup') {
        setFeedback({
          type: 'success',
          text: 'Account created successfully. Your user is now stored in MongoDB.',
        });
        setActiveTab('login');
        setFormData({
          name: '',
          email: formData.email,
          password: '',
        });
        return;
      }

      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setFormData(initialFormState);
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error.message || 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken('');
    setProducts([]);
    setFeedback({
      type: 'info',
      text: 'Session cleared. You can log in again anytime.',
    });
  };

  return (
    <main className="page-shell">
      <section className="panel-column single-panel">
        <div className="auth-card">
          <div className="mini-brand">
            <div className="brand-mark">A</div>
            <div>
              <p className="brand-name">Auth React Suite</p>
              <p className="brand-subtitle">Clean login and signup experience</p>
            </div>
          </div>

          <div className="compact-status">
            <span className={`status-dot ${backendStatus.state}`} />
            <p>{backendStatus.text}</p>
          </div>

          <div className="card-header">
            <div>
              <p className="panel-kicker">Access</p>
              <h2>{activeTab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            </div>

            <div className="tab-switcher">
              <button
                className={activeTab === 'login' ? 'tab-button active' : 'tab-button'}
                onClick={() => switchTab('login')}
                type="button"
              >
                Login
              </button>
              <button
                className={activeTab === 'signup' ? 'tab-button active' : 'tab-button'}
                onClick={() => switchTab('signup')}
                type="button"
              >
                Signup
              </button>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {activeTab === 'signup' ? (
              <label className="field">
                <span>Full name</span>
                <input
                  name="name"
                  onChange={handleChange}
                  placeholder="Mohd Varish"
                  required
                  type="text"
                  value={formData.name}
                />
              </label>
            ) : null}

            <label className="field">
              <span>Email address</span>
              <input
                name="email"
                onChange={handleChange}
                placeholder="you@example.com"
                required
                type="email"
                value={formData.email}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                name="password"
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                type="password"
                value={formData.password}
              />
            </label>

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? 'Submitting...'
                : activeTab === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <div className={`feedback-banner ${feedback.type}`}>{feedback.text}</div>
        </div>

        <div className="workspace-grid">
          <article className="session-card">
            <div className="section-header">
              <div>
                <p className="panel-kicker">Session</p>
                <h3>{token ? 'Authenticated' : 'Not signed in'}</h3>
              </div>
              {token ? (
                <button className="secondary-button" onClick={handleLogout} type="button">
                  Logout
                </button>
              ) : null}
            </div>

            <p className="section-copy">
              {token
                ? 'JWT token stored locally and ready for authenticated requests.'
                : 'Login to generate a token and unlock protected data.'}
            </p>
          </article>

          <article className="products-card">
            <div className="section-header">
              <div>
                <p className="panel-kicker">Protected Data</p>
                <h3>Products</h3>
              </div>
              {isLoadingProducts ? <span className="badge">Loading</span> : null}
            </div>

            {products.length > 0 ? (
              <div className="product-list">
                {products.map((product) => (
                  <div className="product-item" key={`${product.name}-${product.price}`}>
                    <div>
                      <p>{product.name}</p>
                      <span>Data returned from `/products`</span>
                    </div>
                    <strong>Rs. {product.price}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-copy">
                Protected items will appear here after a successful login.
              </p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;
