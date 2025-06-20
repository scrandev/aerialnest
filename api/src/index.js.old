/**
 * Aerial Nest API
 * This file serves dual purposes:
 * 1. Local development server (when run with "npm run dev")
 * 2. AWS Lambda handler (when deployed to AWS)
 */

// Import the built-in Node.js modules we need for the local server
const http = require('http');
const url = require('url');

/**
 * Local Development Server
 * This function creates an HTTP server that mimics how our API will work in AWS
 * but runs on your local machine for testing and development
 */
function startLocalServer() {
    const server = http.createServer((req, res) => {
        // Parse the incoming request URL to understand what the client is asking for
        const parsedUrl = url.parse(req.url, true);
        
        // Set CORS headers so your frontend can communicate with this API
        // Think of CORS as "permission slips" that allow web browsers to make requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');
        
        // Handle preflight requests (browsers send these before the real request)
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Route the request to the appropriate handler
        // This is like a receptionist directing visitors to the right office
        switch (parsedUrl.pathname) {
            case '/':
            case '/api':
                handleApiRoot(res);
                break;
                
            case '/api/health':
                handleHealthCheck(res);
                break;
                
            default:
                handleNotFound(res, parsedUrl.pathname);
        }
    });

    // Start the server on port 3001 (you can change this if needed)
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 Aerial Nest API running locally!`);
        console.log(`📋 Available endpoints:`);
        console.log(`   GET  http://localhost:${PORT}/api`);
        console.log(`   GET  http://localhost:${PORT}/api/health`);
        console.log(`\n💡 Make changes to your code and restart to see updates`);
        console.log(`   Press Ctrl+C to stop the server`);
    });
}

/**
 * Route Handlers
 * These functions handle specific types of requests
 * They work the same way for both local development and AWS Lambda
 */

function handleApiRoot(res) {
    res.writeHead(200);
    res.end(JSON.stringify({
        message: 'Aerial Nest API is running locally!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development',
        endpoints: [
            'GET /api - This endpoint',
            'GET /api/health - Health check'
        ]
    }, null, 2)); // The "null, 2" makes the JSON output pretty and readable
}

function handleHealthCheck(res) {
    res.writeHead(200);
    res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: process.env.DATABASE_URL ? 'configured' : 'not configured yet',
        uptime: process.uptime()
    }, null, 2));
}

function handleNotFound(res, pathname) {
    res.writeHead(404);
    res.end(JSON.stringify({
        error: 'Not Found',
        message: `Path ${pathname} not found`,
        availableEndpoints: ['/api', '/api/health']
    }, null, 2));
}

/**
 * AWS Lambda Handler
 * This function is called when your code runs in AWS Lambda
 * It takes the same logic from above but adapts it to Lambda's event format
 */
exports.lambdaHandler = async (event, context) => {
    console.log('Lambda Event:', JSON.stringify(event, null, 2));
    
    // These headers work the same way as in our local server
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    try {
        // Extract the path from the Lambda event (different structure than local)
        const path = event.rawPath || event.path || '/';
        const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
        
        // Handle preflight requests
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers: corsHeaders, body: '' };
        }
        
        // Use the same routing logic as our local server
        switch (path) {
            case '/':
            case '/api':
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        message: 'Aerial Nest API is running on AWS!',
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                        environment: process.env.NODE_ENV || 'production'
                    })
                };
                
            case '/api/health':
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        database: process.env.DATABASE_URL ? 'connected' : 'not configured'
                    })
                };
                
            default:
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: 'Not Found',
                        message: `Path ${path} not found`
                    })
                };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        
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
 * This is the "smart switch" that detects whether we're running locally or in AWS
 * When you run "npm run dev", this will start the local server
 * When AWS calls this file, it will only use the Lambda handler
 */
if (require.main === module) {
    // This condition is true when you run "node src/index.js" directly
    // It means "if this file is being run directly, not imported by another file"
    startLocalServer();
}

