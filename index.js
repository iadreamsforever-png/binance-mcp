import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Binance from "binance-api-node";

// Correção para ESM
const binance = (Binance.default || Binance)({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

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
            symbol: { type: "string", description: "Par de trading (ex: BTCUSDT)" },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_account",
        description: "Obter informações da conta Binance",
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
      const ticker = await binance.prices({ symbol: args.symbol });
      return {
        content: [{ type: "text", text: JSON.stringify(ticker, null, 2) }],
      };
    }

    if (name === "get_account") {
      const account = await binance.accountInfo();
      return {
        content: [{ type: "text", text: JSON.stringify(account, null, 2) }],
      };
    }

    throw new Error(`Ferramenta desconhecida: ${name}`);
  } catch (error) {
    return {
      content: [{ type: "text", text: `Erro: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
