#!/usr/bin/env node
/**
 * Aerial Nest Database Setup and Test Script
 * This script creates your SQLite database and runs basic tests to ensure everything works.
 * No SQL knowledge required - just run: node setup-database.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'src', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'aerial_nest_development.db');

async function createDatabase() {
    console.log('🏗️  Setting up Aerial Nest database...');
    console.log('=' .repeat(50));
    
    return new Promise((resolve, reject) => {
        // Remove existing database to start fresh
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('🗑️  Removed existing database for fresh start');
        }
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('✅ Connected to SQLite database');
            
            // Read and execute schema
            const schemaPath = path.join(__dirname, 'src', 'database', 'schema.sql');
            if (!fs.existsSync(schemaPath)) {
                reject(new Error('Schema file not found at: ' + schemaPath));
                return;
            }
            
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            db.exec(schema, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('✅ Database schema created successfully!');
                resolve(db);
            });
        });
    });
}

async function verifyDatabaseStructure(db) {
    console.log('\n📋 Checking database structure...');
    
    return new Promise((resolve, reject) => {
        const expectedTables = [
            'users', 'user_sessions', 'email_verification_tokens',
            'document_categories', 'documents', 'trusted_contacts',
            'document_shares', 'emergency_access_requests', 'emergency_access_documents',
            'access_logs', 'user_activity_summary', 'activity_events', 'document_analytics'
        ];
        
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
                reject(err);
                return;
            }
            
            const tableNames = tables.map(t => t.name);
            const missingTables = [];
            
            expectedTables.forEach(expectedTable => {
                if (tableNames.includes(expectedTable)) {
                    console.log(`✅ Table '${expectedTable}' exists`);
                } else {
                    console.log(`❌ Table '${expectedTable}' missing`);
                    missingTables.push(expectedTable);
                }
            });
            
            if (missingTables.length > 0) {
                console.log(`\n⚠️  Warning: Missing tables: ${missingTables.join(', ')}`);
                resolve(false);
            } else {
                console.log(`\n✅ All ${expectedTables.length} tables found!`);
                resolve(true);
            }
        });
    });
}

async function testBasicOperations(db) {
    console.log('\n🧪 Running basic database tests...');
    
    return new Promise(async (resolve, reject) => {
        try {
            // Test 1: Create a test user
            const testEmail = 'test@aerialnest.com';
            const passwordHash = await bcrypt.hash('testpassword123', 10);
            
            db.run(`
                INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
                VALUES (?, ?, ?, ?, ?)
            `, [testEmail, passwordHash, 'Test', 'User', 1], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                const userId = this.lastID;
                console.log(`✅ Test user created with ID: ${userId}`);
                
                // Test 2: Create a test document
                db.run(`
                    INSERT INTO documents (user_id, title, document_type, file_path, file_name, file_size, file_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [userId, 'Test Healthcare Directive', 'healthcare_directive', 
                    '/uploads/test.pdf', 'test.pdf', 1024, 'pdf'], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const documentId = this.lastID;
                    console.log(`✅ Test document created with ID: ${documentId}`);
                    
                    // Test 3: Create a trusted contact
                    db.run(`
                        INSERT INTO trusted_contacts (user_id, contact_name, contact_email, relationship, emergency_contact)
                        VALUES (?, ?, ?, ?, ?)
                    `, [userId, 'Sarah Johnson', 'sarah@example.com', 'daughter', 1], function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        const contactId = this.lastID;
                        console.log(`✅ Test trusted contact created with ID: ${contactId}`);
                        
                        // Test 4: Create a document share
                        db.run(`
                            INSERT INTO document_shares (document_id, user_id, trusted_contact_id, shared_by)
                            VALUES (?, ?, ?, ?)
                        `, [documentId, userId, contactId, userId], function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            console.log('✅ Test document share created');
                            
                            // Test 5: Log some analytics
                            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
                            db.run(`
                                INSERT INTO user_activity_summary (user_id, activity_date, documents_uploaded, trusted_contacts_added)
                                VALUES (?, ?, ?, ?)
                            `, [userId, today, 1, 1], function(err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                
                                console.log('✅ Test analytics logged');
                                console.log('\n🎉 All tests passed! Your database is working correctly.');
                                resolve(true);
                            });
                        });
                    });
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

async function showSampleData(db) {
    console.log('\n📊 Sample data from your database:');
    
    return new Promise((resolve, reject) => {
        // Show users
        db.all('SELECT id, email, first_name, last_name FROM users', (err, users) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log(`\nUsers (${users.length} found):`);
            users.forEach(user => {
                console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
            });
            
            // Show documents
            db.all('SELECT id, title, document_type FROM documents', (err, documents) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`\nDocuments (${documents.length} found):`);
                documents.forEach(doc => {
                    console.log(`  ID: ${doc.id}, Title: ${doc.title}, Type: ${doc.document_type}`);
                });
                
                // Show document categories
                db.all('SELECT name, description FROM document_categories ORDER BY display_order', (err, categories) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    console.log(`\nDocument Categories (${categories.length} available):`);
                    categories.forEach(cat => {
                        console.log(`  - ${cat.name}: ${cat.description}`);
                    });
                    
                    resolve(true);
                });
            });
        });
    });
}

async function cleanupTestData(db) {
    return new Promise((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('\n🧹 Do you want to remove test data? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
                db.run('DELETE FROM users WHERE email = ?', ['test@aerialnest.com'], (err) => {
                    if (err) {
                        console.log('⚠️  Error removing test data:', err.message);
                    } else {
                        console.log('✅ Test data removed');
                    }
                    rl.close();
                    resolve();
                });
            } else {
                console.log('✅ Test data kept for development');
                rl.close();
                resolve();
            }
        });
    });
}

async function main() {
    let db = null;
    
    try {
        // Create the database
        db = await createDatabase();
        
        // Verify structure
        const structureValid = await verifyDatabaseStructure(db);
        if (!structureValid) {
            console.log('❌ Database structure verification failed!');
            return;
        }
        
        // Run tests
        await testBasicOperations(db);
        
        // Show sample data
        await showSampleData(db);
        
        // Optional cleanup
        await cleanupTestData(db);
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Aerial Nest database setup complete!');
        console.log('\nYour database file is located at:', dbPath);
        console.log('You can now start your application!');
        console.log('\nNext steps:');
        console.log('1. Run "npm run dev" to start your API server');
        console.log('2. Visit http://localhost:3001 to see your API');
        console.log('3. Test the endpoints with the browser or curl');
        console.log('4. Start building your frontend!');
        
    } catch (error) {
        console.error('❌ Error during setup:', error.message);
        console.log('\nPlease check the error message above and try again.');
    } finally {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
            });
        }
    }
}

// Run the setup
if (require.main === module) {
    main();
}

module.exports = { createDatabase, verifyDatabaseStructure, testBasicOperations };
