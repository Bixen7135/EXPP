// Quick test to verify environment variables are loaded
console.log('Environment Variables Check:');
console.log('----------------------------');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : '✗ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set (length: ' + process.env.GOOGLE_CLIENT_SECRET.length + ')' : '✗ Missing');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '✗ Missing');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Missing');
console.log('AUTH_TRUST_HOST:', process.env.AUTH_TRUST_HOST || '✗ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('----------------------------');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ Google OAuth credentials are missing!');
  console.log('Make sure .env.local exists and contains GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
} else {
  console.log('✓ All required environment variables are set');
}
