#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@elastic/elasticsearch';
// Hardcoded Elasticsearch configuration - NO environment variables needed
const ELASTICSEARCH_CONFIG = {
  node: ['https://44.199.121.209:9200'],
  
  auth: {
    apiKey: '',
  },
  // Disable SSL verification for development
  tls: {
    rejectUnauthorized: false,
  },
  // Add timeout settings
  requestTimeout: 30000,
  pingTimeout: 10000,
};



// Create Elasticsearch client with hardcoded config
const client = new Client(ELASTICSEARCH_CONFIG);

// Log successful initialization
console.error('=== Elasticsearch MCP Server Starting ===');
console.error('Server URL:', ELASTICSEARCH_CONFIG.node);
console.error('API Key:', ELASTICSEARCH_CONFIG.auth.apiKey.substring(0, 10) + '...');
console.error('========================================');

// Create MCP server
const server = new Server(
  {
    name: 'elasticsearch-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'search_documents',
    description: 'Search documents in Elasticsearch using query DSL',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'string',
          description: 'Index name to search in',
        },
        query: {
          type: 'object',
          description: 'Elasticsearch query DSL object',
        },
        size: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
          default: 10,
        },
        from: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0)',
          default: 0,
        },
      },
      required: ['index', 'query'],
    },
  },
  {
    name: 'get_document',
    description: 'Get a specific document by ID',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'string',
          description: 'Index name',
        },
        id: {
          type: 'string',
          description: 'Document ID',
        },
      },
      required: ['index', 'id'],
    },
  },
  {
    name: 'index_document',
    description: 'Index a new document or update an existing one',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'string',
          description: 'Index name',
        },
        id: {
          type: 'string',
          description: 'Document ID (optional, will be auto-generated if not provided)',
        },
        document: {
          type: 'object',
          description: 'Document to index',
        },
      },
      required: ['index', 'document'],
    },
  },
  {
    name: 'list_indices',
    description: 'List all indices in the cluster',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cluster_health',
    description: 'Get cluster health information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'aggregate_data',
    description: 'Perform aggregations on data',
    inputSchema: {
      type: 'object',
      properties: {
        index: {
          type: 'string',
          description: 'Index name to aggregate on',
        },
        aggregations: {
          type: 'object',
          description: 'Elasticsearch aggregation DSL object',
        },
        query: {
          type: 'object',
          description: 'Optional query to filter data before aggregation',
        },
      },
      required: ['index', 'aggregations'],
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_documents': {
        const { index, query, size = 10, from = 0 } = args as any;
        const response = await client.search({
          index,
          query,
          size,
          from,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                total: response.hits.total,
                hits: response.hits.hits,
                took: response.took,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_document': {
        const { index, id } = args as any;
        const response = await client.get({
          index,
          id,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'index_document': {
        const { index, id, document } = args as any;
        const response = id 
          ? await client.index({ index, id, document })
          : await client.index({ index, document });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                result: response.result,
                id: response._id,
                version: response._version,
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_document': {
        const { index, id } = args as any;
        const response = await client.delete({
          index,
          id,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                result: response.result,
                version: response._version,
              }, null, 2),
            },
          ],
        };
      }

      case 'create_index': {
        const { index, mappings, settings } = args as any;
        const createParams: any = { index };
        if (mappings) createParams.mappings = mappings;
        if (settings) createParams.settings = settings;
        
        const response = await client.indices.create(createParams);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'delete_index': {
        const { index } = args as any;
        const response = await client.indices.delete({
          index,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'list_indices': {
        const response = await client.cat.indices({
          format: 'json',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'cluster_health': {
        const response = await client.cluster.health();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'aggregate_data': {
        const { index, aggregations, query } = args as any;
        const searchParams: any = {
          index,
          aggs: aggregations,
          size: 0, // We only want aggregation results
        };
        if (query) searchParams.query = query;
        
        const response = await client.search(searchParams);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                aggregations: response.aggregations,
                took: response.took,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Elasticsearch operation failed:', errorMessage);
    throw new McpError(
      ErrorCode.InternalError,
      `Elasticsearch operation failed: ${errorMessage}`
    );
  }
});

// Start the server
async function main() {
  try {
    // Test the connection first
    console.error('Testing Elasticsearch connection...');
    await client.ping();
    console.error('✓ Elasticsearch connection successful!');
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('✓ Elasticsearch MCP server running on stdio');
  } catch (error) {
    console.error('✗ Failed to connect to Elasticsearch:', error);
    console.error('Please check your Elasticsearch server is running and accessible');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
