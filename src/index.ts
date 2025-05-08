import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError
 } from "@modelcontextprotocol/sdk/types.js";

 const server = new Server({
    name: "redirect-mcp-server",
    version: "1.0.0",
 }, {
    capabilities: {
        tools: {}
    }
 });

 server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
            name: "get_redirects_by_site_id_and_subsite_code",
            description: "Returns redirect data about a certain site and subsite",
            inputSchema: {
              type: "object",
              properties: {
                siteId: { type: "number" },
                subsiteCode: { type: "string" }
              },
              required: ["siteId", "subsiteCode"]
            }
        }, {
            name: "calculate_sum",
            description: "Add two numbers together",
            inputSchema: {
              type: "object",
              properties: {
                a: { type: "number" },
                b: { type: "number" }
              },
              required: ["a", "b"]
            }
        }]
    };
 });

 server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name === "get_redirects_by_site_id_and_subsite_code") {
        const args = req.params.arguments as { siteId: number; subsiteCode: string } | undefined;
        try {
            if (args?.siteId != null && args?.subsiteCode != null) {
                const response = await fetch('localhost:8080/redirects/' + args.siteId + '-' + args.subsiteCode, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error fetching redirects: ${response.statusText}`);
                }

                const data = await response.json();
                return { toolResult: data };
            }
        } catch (error: any) {
            throw new McpError(ErrorCode.InternalError, `Error fetching redirects: ${error.message}`);
        }
    }
    
    if (req.params.name === "calculate_sum") {
        const args = req.params.arguments as { a: number; b: number } | undefined;
  
        if (args?.a != null && args?.b != null) {
          return { toolResult: args.a + args.b };
        }
      }
    throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
 });

 const transport = new StdioServerTransport();
 await server.connect(transport);