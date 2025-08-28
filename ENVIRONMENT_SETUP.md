# 🔧 Environment Configuration Guide

This guide explains how to configure the Weaviate GUI for different environments (local, staging, production).

## 📋 Quick Setup

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your Weaviate configuration:**

   ```bash
   nano .env.local
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```

## 🌍 Environment Configurations

### 🏠 Local Development (No Authentication)

```env
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=
NODE_ENV=development
```

### 🐳 Docker Compose Setup

```env
WEAVIATE_URL=http://localhost:13065
WEAVIATE_API_KEY=
NODE_ENV=development
```

### ☁️ Weaviate Cloud (Production)

```env
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your-production-api-key
NODE_ENV=production
```

### 🧪 Custom Cloud Instance

```env
WEAVIATE_URL=https://custom.weaviate.example.com
WEAVIATE_API_KEY=your-custom-api-key
NODE_ENV=production
```

## 🔐 API Key Management

The system automatically detects when an API key is required based on:

- **Environment**: `NODE_ENV=production` always requires an API key
- **URL Pattern**: HTTPS URLs or URLs containing:
  - `weaviate.network`
  - `weaviate.io`
  - `cloud`

### When API Key is Required ✅

- Production environment (`NODE_ENV=production`)
- HTTPS URLs (`https://...`)
- Weaviate Cloud URLs (`*.weaviate.network`)
- URLs containing "cloud"

### When API Key is Optional ❌

- Development environment (`NODE_ENV=development`)
- Local HTTP URLs (`http://localhost:...`)
- Docker internal URLs

## 🎛️ Connection Interface

The connection interface automatically adapts:

- **Local Development**: Only shows URL field
- **Production/Cloud**: Shows both URL and API Key fields
- **Smart Detection**: API key field appears when URL suggests cloud instance

## 🔍 Environment Variables Reference

| Variable           | Description           | Required    | Example                                |
| ------------------ | --------------------- | ----------- | -------------------------------------- |
| `WEAVIATE_URL`     | Weaviate instance URL | ✅          | `http://localhost:8080`                |
| `WEAVIATE_API_KEY` | Authentication key    | Conditional | `WVF5YThaHlkYwhGUSmCRgsX3tD5ngdN8pkih` |
| `NODE_ENV`         | Environment mode      | ❌          | `development` / `production`           |

## 🚨 Troubleshooting

### Connection Refused

```
Error: ECONNREFUSED
```

**Solution**: Check if Weaviate is running and the port is correct.

### Unauthorized

```
Error: 401 Unauthorized
```

**Solution**: Verify your API key is correct and has proper permissions.

### Invalid URL

```
Error: Invalid URL format
```

**Solution**: Ensure URL includes protocol (`http://` or `https://`).

### Timeout

```
Error: Connection timeout
```

**Solution**: Check network connectivity and firewall settings.

## 🏗️ Docker Networking

When running in Docker, use internal container ports:

- ✅ Correct: `http://weaviate:8080`
- ❌ Incorrect: `http://localhost:8090` (host-mapped port)

## 🔄 Switching Environments

1. Update `.env.local` with new configuration
2. Restart the development server
3. Use the connection interface to test the new configuration
4. The system will automatically validate and connect

## 📝 Example Configurations

### Local Weaviate with Docker Compose

```env
# .env.local
WEAVIATE_URL=http://localhost:13065
WEAVIATE_API_KEY=
NODE_ENV=development
```

### Weaviate Cloud Sandbox

```env
# .env.local
WEAVIATE_URL=https://sandbox-abc123.weaviate.network
WEAVIATE_API_KEY=your-sandbox-key
NODE_ENV=development
```

### Production Deployment

```env
# .env.local (or .env.production)
WEAVIATE_URL=https://production-cluster.weaviate.network
WEAVIATE_API_KEY=your-production-key
NODE_ENV=production
```

## 🛡️ Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment-specific files** (`.env.local`, `.env.production`)
3. **Rotate API keys** regularly in production
4. **Use HTTPS** for production instances
5. **Restrict API key permissions** to minimum required

---

Need help? Check the [Weaviate Documentation](https://weaviate.io/developers/weaviate) or open an issue!
