# Google OAuth Setup Guide

This guide will walk you through the process of creating Google OAuth credentials to enable Google Workspace integration in SaaStral.

## Prerequisites

- A Google Workspace account with **Super Admin** privileges
- Access to Google Cloud Console
- Your SaaStral instance URL (e.g., `http://localhost:3000` for local development or your production domain)

---

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google Workspace admin account

---

## Step 2: Create a New Project (or Select Existing)

### Option A: Create a New Project

1. Click the project dropdown at the top of the page (next to "Google Cloud")
2. Click **"New Project"**
3. Enter a project name (e.g., "SaaStral Integration")
4. Select your organization (if applicable)
5. Click **"Create"**
6. Wait for the project to be created, then select it from the project dropdown

### Option B: Use Existing Project

1. Click the project dropdown at the top of the page
2. Select your existing project

---

## Step 3: Enable Required APIs

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Admin SDK API"**
3. Click on **"Admin SDK API"**
4. Click **"Enable"**
5. Wait for the API to be enabled (this may take a few seconds)

---

## Step 4: Configure OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"Internal"** (if you only want your organization to use this)
   - If you need external users, select "External" instead
3. Click **"Create"**

### Fill in the required information:

**App Information:**
- **App name:** `SaaStral` (or your preferred name)
- **User support email:** Your email address
- **App logo:** (Optional) Upload SaaStral logo

**App Domain:**
- **Application home page:** Your SaaStral URL (e.g., `http://localhost:3000`)
- **Application privacy policy link:** (Optional)
- **Application terms of service link:** (Optional)

**Authorized domains:**
- Add your domain (e.g., `localhost` for local or `yourdomain.com` for production)

**Developer contact information:**
- **Email addresses:** Your email address

4. Click **"Save and Continue"**

### Configure Scopes:

1. Click **"Add or Remove Scopes"**
2. Search for and add the following scopes:
   - `https://www.googleapis.com/auth/admin.directory.user.readonly` - View users on your domain
   - `https://www.googleapis.com/auth/admin.directory.orgunit.readonly` - View organization units on your domain
3. Click **"Update"**
4. Click **"Save and Continue"**

### Summary:

1. Review your configuration
2. Click **"Back to Dashboard"**

---

## Step 5: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**

### Configure OAuth Client:

**Application type:**
- Select **"Web application"**

**Name:**
- Enter a name (e.g., "SaaStral Web App")

**Authorized JavaScript origins:**
- Click **"+ Add URI"**
- Add your SaaStral URL (e.g., `http://localhost:3000` or `https://yourdomain.com`)

**Authorized redirect URIs:**
- Click **"+ Add URI"**
- Add the callback URL:
  - **Local development:** `http://localhost:3000/api/integrations/google/callback`
  - **Production:** `https://yourdomain.com/api/integrations/google/callback`

4. Click **"Create"**

---

## Step 6: Save Your Credentials

After creating the OAuth client, a modal will appear with your credentials:

1. **Copy the Client ID**
   - Format: `123456789-abc.apps.googleusercontent.com`
2. **Copy the Client Secret**
   - Format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

⚠️ **IMPORTANT:** Keep these credentials secure! Never commit them to version control or share them publicly.

You can also download the JSON file for backup, but **SaaStral only needs the Client ID and Client Secret**.

---

## Step 7: Configure SaaStral

### Option A: Using the UI (Recommended)

1. Log in to your SaaStral instance
2. Navigate to **Settings** → **Integrations**
3. Find the **Google Workspace** card
4. Click **"Configure"**
5. In the modal that appears:
   - Paste your **Client ID**
   - Paste your **Client Secret**
6. Click **"Save & Connect"**
7. You'll be redirected to Google to authorize the connection
8. Grant the requested permissions
9. You'll be redirected back to SaaStral with the integration active

### Option B: Using Environment Variables (Legacy - Not Recommended)

If you're using an older version of SaaStral, you may need to configure via `.env`:

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

**Note:** The database storage method (Option A) is preferred as it supports multi-tenant deployments.

---

## Step 8: Test the Integration

1. After authorizing, SaaStral will automatically trigger an initial sync
2. Go to **Employees** page to see your Google Workspace users
3. Check **Settings** → **Integrations** to view sync status

---

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Cause:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Ensure the redirect URI exactly matches (including `http` vs `https`)

### Error: "Admin SDK API has not been used in project..."

**Cause:** The Admin SDK API is not enabled for your project.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → Library
2. Search for "Admin SDK API"
3. Click "Enable"

### Error: "Access denied. You do not have sufficient permissions..."

**Cause:** The Google account used for authorization doesn't have Super Admin privileges.

**Solution:** Log in with a Google Workspace Super Admin account.

### Error: "OAuth credentials missing"

**Cause:** Credentials haven't been saved to the database yet.

**Solution:** Complete Step 7 to configure credentials via the UI.

---

## Security Best Practices

1. **Restrict Access:** Use "Internal" OAuth consent screen if possible
2. **Minimal Scopes:** Only request the scopes your app needs (directory read-only)
3. **Rotate Secrets:** Periodically rotate your Client Secret
4. **Monitor Usage:** Regularly check Google Cloud Console for unusual API activity
5. **Secure Storage:** SaaStral encrypts OAuth credentials in the database using AES-256-GCM
6. **HTTPS in Production:** Always use HTTPS for production deployments

---

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Workspace Admin SDK Documentation](https://developers.google.com/admin-sdk)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [SaaStral Architecture Guide](../architecture/overview.md)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [SaaStral GitHub Issues](https://github.com/yourusername/saastral/issues)
2. Join our [Discord Community](https://discord.gg/saastral)
3. Review the application logs for detailed error messages

---

**Last Updated:** January 2026
