import { ChromaClient } from "chromadb";
import { OpenAIEmbeddings } from "@langchain/openai";

export class ChromaService {
  private static instance: ChromaService;
  private client: ChromaClient;
  private embeddings: OpenAIEmbeddings;

  private constructor() {
    this.client = new ChromaClient({
      path: "http://localhost:8000"
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002"
    });
  }

  static getInstance(): ChromaService {
    if (!ChromaService.instance) {
      ChromaService.instance = new ChromaService();
    }
    return ChromaService.instance;
  }

  async storeUserInput(userId: string, input: string): Promise<void> {
    try {
      console.log("\n=== Storing Embedding ===");
      console.log("User ID:", userId);
      console.log("Input:", input);

      const embedding = await this.embeddings.embedQuery(input);
      const collection = await this.client.getOrCreateCollection({
        name: `user_${userId}_inputs`
      });

      await collection.upsert({
        ids: [Date.now().toString()],
        documents: [input],
        embeddings: [embedding],
        metadatas: [{ userId, timestamp: new Date().toISOString() }]
      });

      console.log("✅ Successfully stored embedding");
      console.log("Collection:", `user_${userId}_inputs`);
      console.log("======================\n");
    } catch (error) {
      console.error("\n❌ Error storing embedding:");
      console.error(error);
      console.error("======================\n");
    }
  }

  async findSimilarInputs(userId: string, query: string): Promise<string[]> {
    try {
      console.log("\n=== Searching Similar Embeddings ===");
      console.log("User ID:", userId);
      console.log("Query:", query);

      const embedding = await this.embeddings.embedQuery(query);
      const collection = await this.client.getOrCreateCollection({
        name: `user_${userId}_inputs`
      });

      const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults: 5
      });

      console.log("\nSearch Results:");
      console.log("Documents:", results.documents[0]);
      console.log("Distances:", results.distances?.[0]);
      console.log("======================\n");

      return (results.documents[0] || []).filter((doc): doc is string => doc !== null);
    } catch (error) {
      console.error("\n❌ Error searching embeddings:");
      console.error(error);
      console.error("======================\n");
      return [];
    }
  }
}


