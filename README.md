# Secure MCP OAuth UI

A secure OAuth integration hub for Model Context Protocol (MCP).

## Environment Setup

### Frontend Environment Variables

Create an `.env.local` file in the root directory with the following variables:

```
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.secure-mcp-oauth.com

# OAuth Client IDs (public)
NEXT_PUBLIC_SKETCHFAB_CLIENT_ID=your_sketchfab_client_id
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_gmail_client_id
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id
NEXT_PUBLIC_ZOOM_CLIENT_ID=your_zoom_client_id
```

### OAuth Configuration

When setting up your OAuth providers, configure the following callback URLs:

1. For Gmail/Google:
   - Callback URL: `https://your-domain.com/oauth_callback/google`

2. For Sketchfab:
   - Callback URL: `https://your-domain.com/oauth_callback/sketchfab`

3. For Twitter:
   - Callback URL: `https://your-domain.com/oauth_callback/twitter`

4. For Zoom:
   - Callback URL: `https://your-domain.com/oauth_callback/zoom`

For local development, you can use:
- `http://localhost:3000/oauth_callback/google`
- `http://localhost:3000/oauth_callback/sketchfab`
- `http://localhost:3000/oauth_callback/twitter`
- `http://localhost:3000/oauth_callback/zoom`

### Backend Configuration

The backend server requires OAuth client secrets to be securely stored in its environment:

1. For Gmail:
   - Create a project in the Google Cloud Console
   - Enable the Gmail API
   - Create OAuth credentials (Web application type)
   - Store the client secret on the backend server (never in frontend code)
   - Configure the backend with:
     ```
     GMAIL_CLIENT_ID=your_gmail_client_id
     GMAIL_CLIENT_SECRET=your_gmail_client_secret
     GMAIL_REDIRECT_URI=https://your-domain.com/oauth_callback/google
     ```

2. For Sketchfab:
   - Register an application on the Sketchfab developer portal
   - Generate OAuth credentials
   - Store the client secret on the backend server with:
     ```
     SKETCHFAB_CLIENT_ID=your_sketchfab_client_id
     SKETCHFAB_CLIENT_SECRET=your_sketchfab_client_secret
     SKETCHFAB_REDIRECT_URI=https://your-domain.com/oauth_callback/sketchfab
     ```

3. For Zoom:
   - Create an OAuth app in the Zoom App Marketplace
   - Set OAuth scopes (at minimum `user:read`) 
   - Store the client secret on the backend server with:
     ```
     ZOOM_CLIENT_ID=your_zoom_client_id
     ZOOM_CLIENT_SECRET=your_zoom_client_secret
     ZOOM_REDIRECT_URI=https://your-domain.com/oauth_callback/zoom
     ```

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at http://localhost:3000.

## Features

- Secure OAuth integration with multiple providers
- Token management and refresh
- User authentication
- MCP compliant configuration export

<img width="1912" alt="image" src="https://github.com/user-attachments/assets/8936a935-4a5b-4441-a410-4ae48df31eba" />

<img width="1915" alt="image" src="https://github.com/user-attachments/assets/09a9a253-0409-44fe-a820-13f27d989e54" />

<img width="1918" alt="image" src="https://github.com/user-attachments/assets/ac8eb754-1ca8-426c-841b-957678005234" />

## MCP Integration

This application supports exporting configurations in MCP format. For more information about MCP, visit [Model Context Protocol](https://modelcontextprotocol.io/quickstart/user).
