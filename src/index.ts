import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "redirect-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_redirects_by_site_id_and_subsite_code",
        description: "Returns redirect data about a certain site and subsite",
        inputSchema: {
          type: "object",
          properties: {
            siteId: { type: "number" },
            subsiteCode: { type: "string" },
          },
          required: ["siteId", "subsiteCode"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "get_redirects_by_site_id_and_subsite_code") {
    const args = req.params.arguments as
      | { siteId: number; subsiteCode: string }
      | undefined;
    try {
      if (args?.siteId != null && args?.subsiteCode != null) {
        // testing against locally running redirects-api
        const response = await fetch(
          "http://localhost:8080/redirects/" + args.siteId + "-" + args.subsiteCode,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching redirects: ${response.statusText}`);
        }

        const data = await response.json();
        return { toolResult: data };
      }
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Error fetching redirects: ${error.message}`
      );
    }
  }
  throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
});

const transport = new StdioServerTransport();
await server.connect(transport);
