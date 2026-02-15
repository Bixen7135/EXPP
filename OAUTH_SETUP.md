# Google OAuth Setup Guide

## Create New OAuth 2.0 Client ID

If you're getting `invalid_client` errors, follow these steps to create fresh credentials:

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials?project=expp-487206

### 2. Create OAuth 2.0 Client ID

1. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Name: `EXPP Local Development`

### 3. Configure URLs

**Authorized JavaScript origins:**
```
http://localhost:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
```

### 4. Get Credentials

After creating:
1. Copy the **Client ID**
2. Copy the **Client Secret**

### 5. Update .env.local Files

Update both files:
- `c:\projects\web\full-stack\EXPP\project\.env.local`
- `c:\projects\web\full-stack\EXPP\project\apps\web\.env.local`

Replace:
```env
GOOGLE_CLIENT_ID=your-new-client-id-here
GOOGLE_CLIENT_SECRET=your-new-client-secret-here
```

### 6. Configure OAuth Consent Screen

1. Go to **OAuth consent screen**
2. If status is "Testing", add test users:
   - Add your email: `bakhytzhanasan@gmail.com`
   - Click **SAVE**

### 7. Restart and Test

```bash
cd /c/projects/web/full-stack/EXPP/project
bun run dev
```

Open Incognito window → http://localhost:3000 → Test Google Sign-In

## Troubleshooting

- **invalid_client**: Credentials don't match or OAuth app is disabled
- **access_denied**: User not added to test users (if in Testing mode)
- **redirect_uri_mismatch**: Redirect URI not configured correctly
