# Weaviate Collections Explorer

A simple web interface to explore your local Weaviate collections and inspect the data they hold. Built with Next.js 14 and TypeScript, this tool provides an easy way to browse and view your Weaviate data collections.

## Features

- View all locally available Weaviate collections
- Explore collection data in a tabular format
- Dynamic table rendering based on collection schema
- Real-time data fetching from your Weaviate instance
- Advanced data management capabilities:
  - Sort date columns in ascending/descending order
  - Multi-object deletion with confirmation
  - Interactive selection mode for object management
  - Visual feedback for selection state

## Installation & Setup

### Running on Host

1. Install dependencies:

```bash
pnpm install
```

2. Configure Weaviate connection in `.env.local`:

```env
# Required: Weaviate server URL
WEAVIATE_URL=http://localhost:8080

# Optional: API Key (only required if your Weaviate instance has authentication enabled)
WEAVIATE_API_KEY=your-api-key-here
```

3. Start the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:3000

### Running with Docker

1. Prerequisites:

   - Docker and Docker Compose installed
   - A running Weaviate instance in Docker
   - A Docker network for Weaviate communication

2. Configure `docker-compose.yml`:
   - Update the network name to match your Weaviate network
   - Adjust the Weaviate hostname if needed
   - Modify port mapping if required (default: 3200:3000)

Example docker-compose.yml configuration:

```yaml
services:
  copertine-viewer:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3200:3000"
    environment:
      - NODE_ENV=production
      - WEAVIATE_URL=http://weaviate:8080
      - PORT=3000
    networks:
      - weaviate_net

networks:
  weaviate_net:
    external: true
```

3. Build and run:

```bash
docker compose build
docker compose up -d
```

The application will be available at http://localhost:3200

## Configuration

### Weaviate Configuration

The application supports various Weaviate deployment configurations:

- **Local Development**: Configure via `.env.local` file

  ```env
  # Required
  WEAVIATE_URL=http://localhost:8080

  # Optional (for authenticated instances)
  WEAVIATE_API_KEY=your-api-key-here
  ```

- **Docker Deployment**: Configure via `docker-compose.yml` and environment variables
  ```yaml
  environment:
    - WEAVIATE_URL=http://weaviate:8080
    - WEAVIATE_API_KEY=${WEAVIATE_API_KEY:-} # Optional, reads from host env
  ```
- **Weaviate Cloud Services**: Use HTTPS URL with API key
  ```env
  WEAVIATE_URL=https://your-cluster-url.weaviate.network
  WEAVIATE_API_KEY=your-wcs-api-key
  ```

**Authentication Notes:**

- API Key is optional for local/self-hosted Weaviate instances without authentication
- API Key is typically required for Weaviate Cloud Services
- The application will automatically include Bearer token authentication when an API key is provided

## Contributing

Contributions are welcome through pull requests! This is a learning project for Next.js 14 with TypeScript, so suggestions for improvements and best practices are especially appreciated.

## Important Notes

### Learning Project Disclaimer

This is a learning project for Next.js 14 with TypeScript. While functional, the code may not follow all best practices for a Next.js 14 TypeScript project. Suggestions and improvements are welcome!

### ⚠️ Data Safety Warning

**USE AT YOUR OWN RISK**: While this tool is designed for viewing data, any interaction with your Weaviate collections carries inherent risks. There's always a possibility of unintended data modification or loss due to unknown bugs. Please ensure you have proper backups of your Weaviate data before using this tool.

## Technical Details

- Built with Next.js 14
- Written in TypeScript
- Uses TanStack Table for data display
- Styled with Tailwind CSS
- Weaviate TypeScript client for data access

### Recent Enhancements

1. **Date Column Sorting**

   - Click on date column headers to toggle sort order
   - Visual indicators for sort direction (↑↓)
   - Server-side sorting for optimal performance
   - Maintains sort state during data updates

2. **Multi-Object Deletion**

   - Select multiple objects for deletion
   - Intuitive selection mode with checkboxes
   - Visual feedback with button state changes
   - Confirmation modal with type-to-confirm safety
   - Automatic table refresh after deletion

3. **Enhanced User Experience**
   - Clear visual indicators for interactive elements
   - Automatic mode transitions based on user actions
   - Keyboard support (Escape to cancel)
   - Error handling with user-friendly messages

## Troubleshooting

1. If you can't connect to Weaviate:

   - Verify Weaviate is running
   - Check network configuration
   - Ensure correct hostname in configuration

2. For Docker deployments:
   - Verify network connectivity: `docker network inspect weaviate_net`
   - Check logs: `docker compose logs -f`
   - Ensure Weaviate service is accessible from the container network

## License

MIT License

Copyright (c) 2024 rjalexa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
