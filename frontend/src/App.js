import React, { useState, useContext, createContext, useEffect } from 'react';

// ==================== STYLES ====================
const styles = {
  // Colors based on Aerial Nest theme
  colors: {
    deepForest: '#4A6B61',
    ancientPine: '#2D4A45',
    sageGrove: '#5A7B71',
    calmWaters: '#7A9B92',
    riverStone: '#6B8B82',
    weatheredOak: '#8B7355',
    warmEarth: '#A67C5A',
    pureWhite: '#FFFFFF',
    softMist: '#F8FAFA',
    morningLight: '#F2F7F5',
    gentleBreeze: '#E8F0ED'
  },
  
  // Typography
  fonts: {
    crimson: "'Crimson Text', serif",
    nunito: "'Nunito Sans', sans-serif",
    lora: "'Lora', serif",
    source: "'Source Sans Pro', sans-serif"
  }
};

// ==================== API CLIENT ====================
const API_BASE_URL = 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Ensure clean URL construction
    const url = `${API_BASE_URL}${path}`;
    console.log('Making request to:', url); // Debug log

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data); // Debug log
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email, password, firstName, LastName) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        firstName,
	lastName
      }),
    });
  }

  async getProfile() {
    return this.request('/api/user/profile');
  }

  // Document endpoints
  async getCategories() {
    return this.request('/api/categories');
  }

  async getDocuments() {
    return this.request('/api/documents');
  }

  async getTrustedContacts() {
    return this.request('/api/trusted-contacts');
  }
}

const apiClient = new ApiClient();

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      apiClient.getProfile()
        .then(data => setUser(data.user))
        .catch(() => {
          setToken(null);
          apiClient.setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await apiClient.login(email, password);
    setToken(response.token);
    setUser(response.user);
    apiClient.setToken(response.token);
  };

  const register = async (email, password, firstName, lastName) => {
    const response = await apiClient.register(email, password, firstName,lastName);
    setToken(response.token);
    setUser(response.user);
    apiClient.setToken(response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== COMPONENTS ====================

// Button Component
const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  disabled = false,
  children,
  fullWidth = false 
}) => {
  const baseStyle = {
    fontFamily: styles.fonts.nunito,
    fontWeight: 500,
    borderRadius: '28px',
    transition: 'all 0.3s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    display: 'inline-block',
    textAlign: 'center',
    minHeight: '48px',
    minWidth: '48px',
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '16px' },
    medium: { padding: '12px 24px', fontSize: '18px' },
    large: { padding: '16px 32px', fontSize: '20px' }
  };

  const variantStyles = {
    primary: {
      backgroundColor: styles.colors.deepForest,
      color: styles.colors.pureWhite,
    },
    secondary: {
      backgroundColor: styles.colors.calmWaters,
      color: styles.colors.pureWhite,
    },
    tertiary: {
      backgroundColor: styles.colors.pureWhite,
      color: styles.colors.deepForest,
      border: `2px solid ${styles.colors.deepForest}`,
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </button>
  );
};

// Card Component
const Card = ({ children, style }) => {
  const cardStyle = {
    backgroundColor: styles.colors.pureWhite,
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(45, 74, 69, 0.08)',
    border: `1px solid ${styles.colors.gentleBreeze}`,
    ...style
  };

  return <div style={cardStyle}>{children}</div>;
};

// Loading Spinner
const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: `4px solid ${styles.colors.calmWaters}`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  </div>
);

// Error Message
const ErrorMessage = ({ message }) => (
  <div style={{
    backgroundColor: `${styles.colors.warmEarth}20`,
    border: `2px solid ${styles.colors.warmEarth}`,
    color: styles.colors.warmEarth,
    padding: '16px',
    borderRadius: '12px',
    fontSize: '18px',
    marginTop: '16px'
  }}>
    {message}
  </div>
);

// ==================== AUTH COMPONENTS ====================

// Login Form
const LoginForm = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '18px',
    border: `2px solid ${styles.colors.gentleBreeze}`,
    borderRadius: '12px',
    fontFamily: styles.fonts.nunito,
    marginTop: '8px'
  };

  const labelStyle = {
    display: 'block',
    color: styles.colors.deepForest,
    fontSize: '18px',
    fontFamily: styles.fonts.nunito,
    marginBottom: '8px'
  };

  return (
    <Card style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '32px',
        fontFamily: styles.fonts.crimson,
        color: styles.colors.ancientPine,
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        Welcome Back
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && <ErrorMessage message={error} />}
        
        <Button 
          type="submit"
          size="large" 
          fullWidth 
          disabled={isLoading || !email || !password}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: styles.colors.sageGrove, fontSize: '18px' }}>
          New to Aerial Nest?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{
              color: styles.colors.riverStone,
              textDecoration: 'underline',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Create an account
          </button>
        </p>
      </div>
    </Card>
  );
};

// Register Form
const RegisterForm = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register(
	 formData.email,
	 formData.password,
	 formData.firstName,
	 formData.lastName
	);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '18px',
    border: `2px solid ${styles.colors.gentleBreeze}`,
    borderRadius: '12px',
    fontFamily: styles.fonts.nunito,
    marginTop: '8px'
  };

  const labelStyle = {
    display: 'block',
    color: styles.colors.deepForest,
    fontSize: '18px',
    fontFamily: styles.fonts.nunito,
    marginBottom: '8px'
  };

  return (
    <Card style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '32px',
        fontFamily: styles.fonts.crimson,
        color: styles.colors.ancientPine,
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        Create Your Nest
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
	   <label style={labelStyle}>First Name</label>
           <input
             type="text"
             value={formData.firstName}
             onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
             style={inputStyle}
             placeholder="John"
             required
          />
         </div>
 
         <div style={{ marginBottom: '20px' }}>
           <label style={labelStyle}>Last Name</label>
           <input
             type="text"
             value={formData.lastName}
             onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
             style={inputStyle}
             placeholder="Doe"
             required
           />
         </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={inputStyle}
            placeholder="your@email.com"
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={inputStyle}
            placeholder="••••••••"
            required
          />
          <p style={{ color: styles.colors.sageGrove, fontSize: '14px', marginTop: '4px' }}>
            At least 8 characters
          </p>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Confirm Password</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            style={inputStyle}
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && <ErrorMessage message={error} />}
        
        <Button 
          type="submit"
          size="large" 
          fullWidth 
          disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName
         }
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: styles.colors.sageGrove, fontSize: '18px' }}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            style={{
              color: styles.colors.riverStone,
              textDecoration: 'underline',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </Card>
  );
};

// ==================== DOCUMENT COMPONENTS ====================

// Document Card
const DocumentCard = ({ document }) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryColor = (categoryName) => {
    const colorMap = {
      'Will': styles.colors.deepForest,
      'Healthcare Directive': styles.colors.calmWaters,
      'Power of Attorney': styles.colors.riverStone,
      'Financial Documents': styles.colors.weatheredOak,
      'Insurance Policies': styles.colors.warmEarth,
      'Personal Letters': styles.colors.sageGrove,
    };
    return colorMap[categoryName] || styles.colors.deepForest;
  };

  return (
    <Card>
      <div style={{ marginBottom: '16px' }}>
        <span style={{
          backgroundColor: getCategoryColor(document.category_name),
          color: styles.colors.pureWhite,
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 500
        }}>
          {document.category_name}
        </span>
        {document.version > 1 && (
          <span style={{
            float: 'right',
            color: styles.colors.sageGrove,
            fontSize: '14px'
          }}>
            v{document.version}
          </span>
        )}
      </div>
      
      <h3 style={{
        fontSize: '20px',
        fontFamily: styles.fonts.crimson,
        color: styles.colors.ancientPine,
        marginBottom: '8px'
      }}>
        {document.title}
      </h3>
      
      <div style={{ color: styles.colors.sageGrove, marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', marginBottom: '4px' }}>
          Uploaded: {formatDate(document.upload_date)}
        </p>
        <p style={{ fontSize: '14px' }}>
          Size: {formatFileSize(document.file_size)}
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="primary" size="small">View</Button>
        <Button variant="tertiary" size="small">Share</Button>
      </div>
    </Card>
  );
};

// Document Library
const DocumentLibrary = () => {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsResponse, catsResponse] = await Promise.all([
          apiClient.getDocuments(),
          apiClient.getCategories()
        ]);
        setDocuments(docsResponse.documents || []);
        setCategories(catsResponse.categories || []);
      } catch (err) {
        setError(err.message || 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDocuments = selectedCategory
    ? documents.filter(doc => doc.category_id === selectedCategory)
    : documents;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const categoryButtonStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '18px',
    fontFamily: styles.fonts.nunito,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? styles.colors.deepForest : styles.colors.morningLight,
    color: isActive ? styles.colors.pureWhite : styles.colors.deepForest,
    marginRight: '12px',
    marginBottom: '12px',
    transition: 'all 0.3s ease'
  });

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <h2 style={{
          fontSize: '32px',
          fontFamily: styles.fonts.crimson,
          color: styles.colors.ancientPine
        }}>
          Your Documents
        </h2>
        <Button variant="primary" size="medium">
          Upload Document
        </Button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={categoryButtonStyle(selectedCategory === null)}
        >
          All Documents
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={categoryButtonStyle(selectedCategory === category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredDocuments.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ 
            fontSize: '20px', 
            color: styles.colors.sageGrove, 
            marginBottom: '16px' 
          }}>
            No documents found
          </p>
          <Button variant="primary">Upload Your First Document</Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== DASHBOARD COMPONENTS ====================

// Dashboard
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentUploads: 0,
    trustedContacts: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [docsResponse, contactsResponse] = await Promise.all([
          apiClient.getDocuments(),
          apiClient.getTrustedContacts()
        ]);
        
        const docs = docsResponse.documents || [];
        const contacts = contactsResponse.contacts || [];
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDocs = docs.filter(doc => 
          new Date(doc.upload_date) > thirtyDaysAgo
        );

        setStats({
          totalDocuments: docs.length,
          recentUploads: recentDocs.length,
          trustedContacts: contacts.length,
          pendingTasks: 0
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Documents', value: stats.totalDocuments, color: styles.colors.calmWaters },
    { label: 'Recent Uploads', value: stats.recentUploads, color: styles.colors.riverStone },
    { label: 'Trusted Contacts', value: stats.trustedContacts, color: styles.colors.weatheredOak },
    { label: 'Pending Tasks', value: stats.pendingTasks, color: styles.colors.warmEarth }
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '40px',
          fontFamily: styles.fonts.crimson,
          color: styles.colors.ancientPine,
          marginBottom: '8px'
        }}>
          Welcome back, {user?.full_name?.split(' ')[0] || 'Friend'}
        </h1>
        <p style={{
          fontSize: '20px',
          color: styles.colors.sageGrove
        }}>
          Your digital nest is secure and ready
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {statCards.map((stat, index) => (
          <Card key={index} style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: stat.color,
              borderRadius: '50%',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: styles.colors.pureWhite,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {stat.value}
            </div>
            <p style={{ color: styles.colors.sageGrove, fontSize: '18px' }}>
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        <Card>
          <h2 style={{
            fontSize: '24px',
            fontFamily: styles.fonts.crimson,
            color: styles.colors.ancientPine,
            marginBottom: '16px'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            <Button variant="primary" size="large" fullWidth>
              📄 Upload Document
            </Button>
            <Button variant="secondary" size="large" fullWidth>
              👥 Add Trusted Contact
            </Button>
            <Button variant="tertiary" size="large" fullWidth>
              📋 Start Planning
            </Button>
            <Button variant="tertiary" size="large" fullWidth>
              🔔 View Notifications
            </Button>
          </div>
        </Card>

        <Card>
          <h2 style={{
            fontSize: '24px',
            fontFamily: styles.fonts.crimson,
            color: styles.colors.ancientPine,
            marginBottom: '16px'
          }}>
            Recent Activity
          </h2>
          <div style={{ color: styles.colors.sageGrove }}>
            <p style={{ fontWeight: 500 }}>No recent activity</p>
            <p style={{ fontSize: '14px' }}>
              Upload your first document to get started
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==================== NAVIGATION ====================

const Navigation = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'planning', label: 'Planning', icon: '📋' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
  ];

  const navButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '18px',
    fontFamily: styles.fonts.nunito,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? styles.colors.morningLight : 'transparent',
    color: isActive ? styles.colors.deepForest : styles.colors.sageGrove,
    transition: 'all 0.3s ease'
  });

  return (
    <nav style={{
      backgroundColor: styles.colors.pureWhite,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderBottom: `1px solid ${styles.colors.gentleBreeze}`
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '80px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontFamily: styles.fonts.crimson,
            color: styles.colors.ancientPine
          }}>
            Aerial Nest
          </h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                style={navButtonStyle(currentView === item.id)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{
            fontSize: '18px',
            color: styles.colors.sageGrove,
            fontFamily: styles.fonts.nunito
          }}>
            {user?.email}
          </span>
          <Button variant="tertiary" size="small" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
};

// ==================== MAIN APP ====================

const App = () => {
  const [authMode, setAuthMode] = useState('login');
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <AuthProvider>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${styles.colors.softMist} 0%, ${styles.colors.morningLight} 100%)`,
        fontFamily: styles.fonts.nunito
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,500;1,400&family=Nunito+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Source+Sans+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          input:focus {
            outline: none;
            border-color: ${styles.colors.calmWaters};
          }
        `}</style>
        <AppContent 
          authMode={authMode} 
          setAuthMode={setAuthMode}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      </div>
    </AuthProvider>
  );
};

const AppContent = ({ authMode, setAuthMode, currentView, setCurrentView }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '16px' 
      }}>
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '48px',
              fontFamily: styles.fonts.crimson,
              color: styles.colors.ancientPine,
              marginBottom: '16px'
            }}>
              Aerial Nest
            </h1>
            <p style={{
              fontSize: '20px',
              color: styles.colors.sageGrove,
              fontFamily: styles.fonts.lora,
              fontStyle: 'italic'
            }}>
              "Like birds carefully building their nest, we help you create a place where your family's future can flourish."
            </p>
          </div>
          {authMode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 16px' 
      }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'documents' && <DocumentLibrary />}
        {currentView === 'planning' && (
          <Card style={{ textAlign: 'center', padding: '48px' }}>
            <h2 style={{
              fontSize: '32px',
              fontFamily: styles.fonts.crimson,
              color: styles.colors.ancientPine,
              marginBottom: '16px'
            }}>
              Planning Tools
            </h2>
            <p style={{ fontSize: '20px', color: styles.colors.sageGrove }}>
              Coming soon...
            </p>
          </Card>
        )}
        {currentView === 'contacts' && (
          <Card style={{ textAlign: 'center', padding: '48px' }}>
            <h2 style={{
              fontSize: '32px',
              fontFamily: styles.fonts.crimson,
              color: styles.colors.ancientPine,
              marginBottom: '16px'
            }}>
              Trusted Contacts
            </h2>
            <p style={{ fontSize: '20px', color: styles.colors.sageGrove }}>
              Coming soon...
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default App;
