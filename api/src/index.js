/**
 * Aerial Nest API
 * Enhanced version with database connectivity and authentication
 * This file serves dual purposes:
 * 1. Local development server (when run with "npm run dev")
 * 2. AWS Lambda handler (when deployed to AWS)
 */

// Import the built-in Node.js modules we need
const http = require('http');
const url = require('url');
const path = require('path');
const querystring = require('querystring');

// Import database and authentication modules
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database setup
let db = null;

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Initialize Database Connection
 * Works for both local SQLite and production PostgreSQL
 */
function initializeDatabase() {
    if (process.env.DATABASE_URL) {
        // Production: PostgreSQL connection
        console.log('🔄 Connecting to PostgreSQL database...');
        // TODO: Add PostgreSQL connection when ready for production
        return null;
    } else {
        // Development: SQLite connection
        const dbPath = path.join(__dirname, 'database', 'aerial_nest_development.db');
        console.log('🔄 Connecting to SQLite database at:', dbPath);
        
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Database connection failed:', err.message);
                return null;
            }
            console.log('✅ Connected to SQLite database');
        });
        
        return db;
    }
}

/**
 * Utility function to parse JSON request body
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Invalid JSON'));
            }
        });
    });
}

/**
 * Utility function to verify JWT tokens
 */
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * Local Development Server
 * Enhanced with database routes and authentication
 */
function startLocalServer() {
    // Initialize database when starting local server
    initializeDatabase();
    
    const server = http.createServer(async (req, res) => {
        // Parse the incoming request URL
        const parsedUrl = url.parse(req.url, true);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            // Route the request to the appropriate handler
            await routeRequest(req, res, parsedUrl);
        } catch (error) {
            console.error('Request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            }));
        }
    });

    // Start the server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Aerial Nest API running locally!`);
        console.log(`📋 Available endpoints:`);
        console.log(`   GET  http://localhost:${PORT}/api`);
        console.log(`   GET  http://localhost:${PORT}/api/health`);
        console.log(`   GET  http://localhost:${PORT}/api/categories`);
        console.log(`   POST http://localhost:${PORT}/api/auth/register`);
        console.log(`   POST http://localhost:${PORT}/api/auth/login`);
        console.log(`   GET  http://localhost:${PORT}/api/user/profile`);
        console.log(`   GET  http://localhost:${PORT}/api/documents`);
        console.log(`\n💡 Make changes to your code and restart to see updates`);
        console.log(`   Press Ctrl+C to stop the server`);
    });
}

/**
 * Enhanced Request Router
 * Handles all API endpoints for both local and Lambda
 */
async function routeRequest(req, res, parsedUrl) {
    const path = parsedUrl.pathname;
    const method = req.method;
    
    // API Root
    if (path === '/' || path === '/api') {
        return handleApiRoot(res);
    }
    
    // Health Check
    if (path === '/api/health') {
        return handleHealthCheck(res);
    }
    
    // Document Categories
    if (path === '/api/categories' && method === 'GET') {
        return handleGetCategories(res);
    }
    
    // Authentication Routes
    if (path === '/api/auth/register' && method === 'POST') {
        const body = await parseRequestBody(req);
        return handleRegister(res, body);
    }
    
    if (path === '/api/auth/login' && method === 'POST') {
        const body = await parseRequestBody(req);
        return handleLogin(res, body);
    }
    
    // Protected Routes (require authentication)
    const authHeader = req.headers.authorization;
    const user = verifyToken(authHeader);
    
    if (path === '/api/user/profile' && method === 'GET') {
        if (!user) return handleUnauthorized(res);
        return handleGetProfile(res, user);
    }
    
    if (path === '/api/documents' && method === 'GET') {
        if (!user) return handleUnauthorized(res);
        return handleGetDocuments(res, user);
    }
    
    if (path === '/api/trusted-contacts' && method === 'GET') {
        if (!user) return handleUnauthorized(res);
        return handleGetTrustedContacts(res, user);
    }
    
    // Not Found
    return handleNotFound(res, path);
}

/**
 * Route Handlers
 */

function handleApiRoot(res) {
    res.writeHead(200);
    res.end(JSON.stringify({
        message: 'Aerial Nest API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: [
            'GET /api - This endpoint',
            'GET /api/health - Health check',
            'GET /api/categories - Document categories',
            'POST /api/auth/register - Register new user',
            'POST /api/auth/login - Login user',
            'GET /api/user/profile - Get user profile (auth required)',
            'GET /api/documents - Get user documents (auth required)',
            'GET /api/trusted-contacts - Get trusted contacts (auth required)'
        ]
    }, null, 2));
}

function handleHealthCheck(res) {
    res.writeHead(200);
    res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: db ? 'connected' : 'not configured',
        uptime: process.uptime()
    }, null, 2));
}

function handleGetCategories(res) {
    if (!db) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Database not available' }));
        return;
    }
    
    db.all('SELECT * FROM document_categories ORDER BY display_order', (err, categories) => {
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ categories }));
    });
}

async function handleRegister(res, body) {
    try {
        const { email, password, firstName, lastName } = body;
        
        // Basic validation
        if (!email || !password || !firstName || !lastName) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'All fields are required' }));
            return;
        }
        
        if (!db) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database not available' }));
            return;
        }
        
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Database error' }));
                return;
            }
            
            if (user) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'User already exists' }));
                return;
            }
            
            // Hash password and create user
            const passwordHash = await bcrypt.hash(password, 10);
            
            db.run(`
                INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
                VALUES (?, ?, ?, ?, ?)
            `, [email, passwordHash, firstName, lastName, 0], function(err) {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Failed to create user' }));
                    return;
                }
                
                const userId = this.lastID;
                const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
                
                res.writeHead(201);
                res.end(JSON.stringify({
                    message: 'User created successfully',
                    token,
                    user: { id: userId, email, firstName, lastName }
                }));
            });
        });
    } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Server error' }));
    }
}

async function handleLogin(res, body) {
    try {
        const { email, password } = body;
        
        if (!email || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Email and password are required' }));
            return;
        }
        
        if (!db) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database not available' }));
            return;
        }
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Database error' }));
                return;
            }
            
            if (!user) {
                res.writeHead(401);
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
                return;
            }
            
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                res.writeHead(401);
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
                return;
            }
            
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
            
            res.writeHead(200);
            res.end(JSON.stringify({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            }));
        });
    } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Server error' }));
    }
}

function handleGetProfile(res, user) {
    if (!db) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Database not available' }));
        return;
    }
    
    db.get('SELECT id, email, first_name, last_name, phone, city, state FROM users WHERE id = ?', 
           [user.userId], (err, userRecord) => {
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
        
        if (!userRecord) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ user: userRecord }));
    });
}

function handleGetDocuments(res, user) {
    if (!db) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Database not available' }));
        return;
    }
    
    db.all(`
        SELECT d.*, dc.name as category_name 
        FROM documents d 
        LEFT JOIN document_categories dc ON d.category_id = dc.id 
        WHERE d.user_id = ? AND d.is_active = 1 
        ORDER BY d.upload_date DESC
    `, [user.userId], (err, documents) => {
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ documents }));
    });
}

function handleGetTrustedContacts(res, user) {
    if (!db) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Database not available' }));
        return;
    }
    
    db.all('SELECT * FROM trusted_contacts WHERE user_id = ? ORDER BY contact_name', 
           [user.userId], (err, contacts) => {
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Database error' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ contacts }));
    });
}

function handleUnauthorized(res) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'Authorization required' }));
}

function handleNotFound(res, pathname) {
    res.writeHead(404);
    res.end(JSON.stringify({
        error: 'Not Found',
        message: `Path ${pathname} not found`,
        availableEndpoints: ['/api', '/api/health', '/api/categories', '/api/auth/register', '/api/auth/login']
    }, null, 2));
}

/**
 * AWS Lambda Handler
 * Enhanced to handle database routes and authentication
 */
exports.lambdaHandler = async (event, context) => {
    console.log('Lambda Event:', JSON.stringify(event, null, 2));
    
    // Initialize database for Lambda (will use PostgreSQL in production)
    if (!db) {
        initializeDatabase();
    }
    
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    try {
        const path = event.rawPath || event.path || '/';
        const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
        
        // Handle preflight requests
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers: corsHeaders, body: '' };
        }
        
        // Create a mock request/response for Lambda
        const mockReq = {
            method,
            headers: event.headers || {},
            body: event.body
        };
        
        const mockRes = {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
            writeHead: function(code) { this.statusCode = code; },
            end: function(data) { this.body = data; }
        };
        
        // Use the same routing logic
        await routeRequest(mockReq, mockRes, { pathname: path });
        
        return {
            statusCode: mockRes.statusCode,
            headers: mockRes.headers,
            body: mockRes.body
        };
        
    } catch (error) {
        console.error('Lambda Error:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred'
            })
        };
    }
};

/**
 * Auto-start Logic
 * Starts local server when run directly
 */
if (require.main === module) {
    startLocalServer();
}

// Graceful shutdown for local development
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Aerial Nest server...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
