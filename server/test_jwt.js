const jwt = require('jsonwebtoken');
require('dotenv').config();

// Check JWT secret from environment
const JWT_SECRET_INDEX = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';
const JWT_SECRET_MIDDLEWARE = process.env.JWT_SECRET || 'a-very-secret-and-secure-key-that-you-should-change';

console.log('=== JWT Secret Testing ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Secrets match:', JWT_SECRET_INDEX === JWT_SECRET_MIDDLEWARE);

// Test token creation and verification
const testPayload = { id: 3, username: 'admin', role: 'admin' };

console.log('\n=== Token Creation Test ===');
try {
  const token = jwt.sign(testPayload, JWT_SECRET_INDEX, { expiresIn: '8h' });
  console.log('Token created successfully');
  console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
  
  console.log('\n=== Token Verification Test ===');
  const decoded = jwt.verify(token, JWT_SECRET_MIDDLEWARE);
  console.log('Token verified successfully');
  console.log('Decoded payload:', decoded);
  
} catch (error) {
  console.error('JWT Error:', error.message);
}