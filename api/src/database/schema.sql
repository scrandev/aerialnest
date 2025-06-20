-- Aerial Nest MVP Database Schema
-- SQLite version for local development (PostgreSQL compatible)

-- Enable foreign key constraints in SQLite
PRAGMA foreign_keys = ON;

-- ================================
-- CORE USER MANAGEMENT
-- ================================

-- Primary user accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    email_verified BOOLEAN DEFAULT 0,
    email_verified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session management for authentication
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- DOCUMENT MANAGEMENT
-- ================================

-- Document categories for organization
CREATE TABLE document_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core document storage
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(100) NOT NULL, -- 'healthcare_directive', 'will', 'financial_poa', 'insurance', 'other'
    file_path VARCHAR(500) NOT NULL, -- S3 path or local file path
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'jpg', etc.
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1, -- simple versioning for MVP
    user_notes TEXT, -- Margaret's personal notes about this document
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL
);

-- ================================
-- FAMILY & TRUSTED CONTACTS
-- ================================

-- Trusted contact relationships
CREATE TABLE trusted_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    relationship VARCHAR(100), -- 'daughter', 'son', 'spouse', 'executor', 'friend', etc.
    can_access_all BOOLEAN DEFAULT 0, -- simple permission for MVP
    emergency_contact BOOLEAN DEFAULT 0,
    notes TEXT, -- Margaret's personal notes about this person
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Document sharing with trusted contacts
CREATE TABLE document_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- document owner
    trusted_contact_id INTEGER NOT NULL,
    access_type VARCHAR(50) DEFAULT 'view', -- 'view', 'download'
    share_message TEXT, -- personal message from Margaret when sharing
    shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    shared_by INTEGER NOT NULL, -- who granted this access
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trusted_contact_id) REFERENCES trusted_contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id)
);

-- ================================
-- EMERGENCY ACCESS SYSTEM
-- ================================

-- Emergency access requests
CREATE TABLE emergency_access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, -- document owner
    trusted_contact_id INTEGER NOT NULL,
    requested_by_email VARCHAR(255) NOT NULL, -- in case they don't have account yet
    requested_by_name VARCHAR(255) NOT NULL,
    request_reason TEXT NOT NULL,
    emergency_type VARCHAR(100), -- 'medical', 'financial', 'general'
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Simple approval workflow for MVP
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
    approved_at DATETIME NULL,
    expires_at DATETIME NOT NULL, -- auto-expire after set period
    denial_reason TEXT NULL,
    
    -- Simple admin override for MVP support
    admin_approved_by INTEGER NULL,
    admin_notes TEXT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trusted_contact_id) REFERENCES trusted_contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_approved_by) REFERENCES users(id)
);

-- Documents requested in emergency access
CREATE TABLE emergency_access_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emergency_request_id INTEGER NOT NULL,
    document_id INTEGER NOT NULL,
    granted_access_type VARCHAR(50) DEFAULT 'view', -- what access was actually granted
    accessed_at DATETIME NULL, -- when document was actually accessed
    FOREIGN KEY (emergency_request_id) REFERENCES emergency_access_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ================================
-- AUDIT & SECURITY LOGGING
-- ================================

-- Essential access logging for security and legal protection
CREATE TABLE access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, -- document owner (nullable for emergency access)
    accessed_by_user_id INTEGER, -- who accessed (nullable for non-users)
    accessed_by_email VARCHAR(255), -- for non-registered users in emergency
    accessed_by_name VARCHAR(255),
    document_id INTEGER,
    action VARCHAR(100) NOT NULL, -- 'viewed', 'downloaded', 'shared', 'emergency_accessed', 'uploaded'
    access_context VARCHAR(100), -- 'normal', 'emergency', 'shared'
    ip_address VARCHAR(45), -- supports IPv6
    user_agent TEXT,
    emergency_request_id INTEGER NULL,
    session_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (accessed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (emergency_request_id) REFERENCES emergency_access_requests(id) ON DELETE SET NULL
);

-- ================================
-- ANALYTICS & USER BEHAVIOR
-- ================================

-- Daily user activity summary for analytics
CREATE TABLE user_activity_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_date DATE NOT NULL,
    
    -- Core engagement metrics
    login_count INTEGER DEFAULT 0,
    total_session_minutes INTEGER DEFAULT 0,
    pages_visited INTEGER DEFAULT 0,
    
    -- Document activity
    documents_uploaded INTEGER DEFAULT 0,
    documents_viewed INTEGER DEFAULT 0,
    documents_downloaded INTEGER DEFAULT 0,
    documents_shared INTEGER DEFAULT 0,
    
    -- Family connection activity
    trusted_contacts_added INTEGER DEFAULT 0,
    shares_created INTEGER DEFAULT 0,
    emergency_requests_made INTEGER DEFAULT 0,
    
    -- Planning progress indicators  
    planning_areas_visited TEXT, -- JSON array: ['healthcare', 'financial', 'family']
    features_used TEXT, -- JSON array: ['document_upload', 'sharing', 'emergency_access']
    
    -- User journey tracking
    onboarding_steps_completed INTEGER DEFAULT 0,
    help_articles_viewed INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per user per day
    UNIQUE(user_id, activity_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time activity tracking for immediate insights
CREATE TABLE activity_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id VARCHAR(255),
    
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'document_upload', 'share_created', etc.
    event_category VARCHAR(50) NOT NULL, -- 'navigation', 'document', 'sharing', 'emergency'
    event_details TEXT, -- JSON for event-specific data
    
    -- Context that helps understand user behavior
    page_url VARCHAR(500),
    referrer_url VARCHAR(500),
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    -- Timing data for understanding user flow
    session_start_time DATETIME,
    time_since_last_event INTEGER, -- seconds since last activity
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Track document-specific engagement patterns
CREATE TABLE document_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Document lifecycle metrics
    upload_date DATE NOT NULL,
    first_shared_date DATE,
    first_accessed_date DATE,
    last_accessed_date DATE,
    
    -- Engagement counters
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    emergency_access_count INTEGER DEFAULT 0,
    
    -- Document completion and quality indicators
    has_description BOOLEAN DEFAULT 0,
    has_user_notes BOOLEAN DEFAULT 0,
    file_size_mb REAL,
    
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Session management
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Document queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_active ON documents(is_active);
CREATE INDEX idx_documents_upload_date ON documents(upload_date);

-- Sharing and access
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_trusted_contact ON document_shares(trusted_contact_id);
CREATE INDEX idx_trusted_contacts_user_id ON trusted_contacts(user_id);
CREATE INDEX idx_trusted_contacts_email ON trusted_contacts(contact_email);

-- Emergency access
CREATE INDEX idx_emergency_requests_user_id ON emergency_access_requests(user_id);
CREATE INDEX idx_emergency_requests_status ON emergency_access_requests(status);
CREATE INDEX idx_emergency_requests_expires_at ON emergency_access_requests(expires_at);

-- Audit and analytics
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_document_id ON access_logs(document_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at);
CREATE INDEX idx_activity_summary_user_date ON user_activity_summary(user_id, activity_date);
CREATE INDEX idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX idx_activity_events_created_at ON activity_events(created_at);

-- ================================
-- INITIAL DATA SETUP
-- ================================

-- Default document categories
INSERT INTO document_categories (name, description, display_order) VALUES
('Healthcare', 'Medical directives, healthcare proxies, and medical information', 1),
('Legal', 'Wills, trusts, and legal documents', 2),
('Financial', 'Powers of attorney, insurance policies, and financial accounts', 3),
('Personal', 'Letters, memories, and personal messages', 4),
('Property', 'Deeds, titles, and property information', 5),
('Other', 'Miscellaneous important documents', 6);
