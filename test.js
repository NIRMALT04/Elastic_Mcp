// Simple test to verify MCP server is working
const { spawn } = require('child_process');

// Start the MCP server
const server = spawn('npm', ['run', 'dev'], {
  cwd: 'C:\\Users\\Nirmal\\Desktop\\elasticsearch-mcp-server',
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test the list_tools request
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list"
};

server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString());
});

// Send the request after a short delay
setTimeout(() => {
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Close after testing
  setTimeout(() => {
    server.kill();
  }, 2000);
}, 1000);
