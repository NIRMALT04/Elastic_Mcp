# Elasticsearch MCP Server

A Model Context Protocol (MCP) server that connects Claude Desktop to your Elasticsearch cluster - supports both Elastic Cloud and organization/on-premise deployments with full security features.

## Quick Setup

### 1. Install Dependencies
```bash
cd elasticsearch-mcp-server
npm install
npm run build
```

### 2. Configure Your Connection

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your Elasticsearch connection details:

#### For Organization/On-premise Clusters (Recommended)
```env
# Your organization's Elasticsearch URL
ELASTIC_NODE_URL=https://your-org-elasticsearch.company.com:9200

# Option A: API Key authentication (most secure)
ELASTIC_API_KEY=your-base64-encoded-api-key

# Option B: Username/Password authentication
# ELASTIC_USERNAME=your-username
# ELASTIC_PASSWORD=your-password

# Security: CA Certificate (if using custom CA)
ELASTIC_CA_CERT_PATH=/path/to/your-ca-certificate.pem

# Only for development/testing (not recommended for production)
# ELASTIC_SKIP_CERT_VERIFICATION=true
```

#### For Elastic Cloud (if applicable)
```env
ELASTIC_CLOUD_ID=your-cloud-id-from-dashboard
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-elastic-cloud-password
```

### 3. Test Your Connection
```bash
npm run dev
```
If configured correctly, you should see: "Elasticsearch MCP server running on stdio"

### 4. Configure Claude Desktop

Add this to your Claude Desktop configuration:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "elasticsearch": {
      "command": "node",
      "args": ["C:\\Users\\Nirmal\\Desktop\\elasticsearch-mcp-server\\build\\index.js"],
      "env": {
        "ELASTIC_NODE_URL": "https://your-org-elasticsearch.company.com:9200",
        "ELASTIC_API_KEY": "your-api-key-here",
        "ELASTIC_CA_CERT_PATH": "C:\\path\\to\\ca-cert.pem"
      }
    }
  }
}
```

### 5. Restart Claude Desktop

The MCP server should now be available in Claude!

## Security Best Practices

### API Key Setup (Recommended)
1. In Kibana, go to **Stack Management** > **API Keys**
2. Create a new API key with appropriate permissions
3. Use the base64-encoded key in `ELASTIC_API_KEY`

### Certificate Management
- For organization clusters with custom CAs, specify `ELASTIC_CA_CERT_PATH`
- Never use `ELASTIC_SKIP_CERT_VERIFICATION=true` in production

### Permissions
Grant only necessary permissions:
- **Read-only** for search operations
- **Index privileges** only for specific indices you need to modify
- **Cluster privileges** only if needed for monitoring

## Available Tools

Once connected, Claude can use these Elasticsearch operations:

- **search_documents** - Full-text search with Query DSL
- **get_document** - Retrieve specific documents
- **index_document** - Create/update documents
- **delete_document** - Remove documents
- **create_index** - Create indices with mappings
- **delete_index** - Remove indices
- **list_indices** - View all indices
- **cluster_health** - Check cluster status
- **aggregate_data** - Analytics and aggregations

## Example Usage

After setup, you can ask Claude:

- "Search for error logs from the last hour in the application-logs index"
- "Show me the cluster health and any issues"
- "Create an index for storing user events with proper field mappings"
- "Aggregate sales data by region from the transactions index"
- "Find all documents containing 'authentication failed' in security logs"

## Troubleshooting

### Connection Issues
- **SSL/TLS errors**: Verify `ELASTIC_CA_CERT_PATH` or network connectivity
- **Authentication failed**: Check API key or username/password
- **Connection refused**: Verify `ELASTIC_NODE_URL` and network access

### Permission Errors
- Ensure your API key/user has necessary index and cluster permissions
- Check Elasticsearch audit logs for denied operations

### Development Testing
```bash
# Test with environment variables
ELASTIC_NODE_URL=https://your-cluster.com:9200 ELASTIC_API_KEY=your-key npm run dev
```

## Security Notes

- Store credentials securely in Claude Desktop config, not in code
- Use API keys instead of username/password when possible
- Regularly rotate API keys
- Monitor access logs in your Elasticsearch cluster
- Use least-privilege access principles

## Configuration Examples

### High-Security Organization Setup
```env
ELASTIC_NODE_URL=https://es-prod.yourcompany.com:9200
ELASTIC_API_KEY=base64EncodedApiKey==
ELASTIC_CA_CERT_PATH=/etc/ssl/certs/company-ca.pem
```

### Development/Testing Setup
```env
ELASTIC_NODE_URL=https://es-dev.yourcompany.com:9200
ELASTIC_USERNAME=dev-user
ELASTIC_PASSWORD=dev-password
ELASTIC_SKIP_CERT_VERIFICATION=true
```
