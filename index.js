import Binance from 'binance-api-node';

const binance = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "binance-mcp",
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
        name: "get_ticker",
        description: "Obter preço atual de um par (ex: BTCUSDT)",
        inputSchema: {
          type: "object",
          properties: {
            symbol: { type: "string" },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_account",
        description: "Obter informações da conta",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_ticker") {
      const price = await binance.prices({ symbol: args.symbol });
      return {
        content: [{ type: "text", text: JSON.stringify(price, null, 2) }],
      };
    }

    if (name === "get_account") {
      const account = await binance.accountInfo();
      return {
        content: [{ type: "text", text: JSON.stringify(account, null, 2) }],
      };
    }

    throw new Error("Tool not found");
  } catch (error) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
