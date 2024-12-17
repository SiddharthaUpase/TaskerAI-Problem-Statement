import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { MemoryService } from "./memoryService";
import { ChromaService } from "./chromaService";

export class ChatService {
  private static instance: ChatService;
  private model: ChatOpenAI;
  private memoryService: MemoryService;
  private chromaService: ChromaService;

  private constructor() {
    this.model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });
    this.memoryService = MemoryService.getInstance();
    this.chromaService = ChromaService.getInstance();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private createChain(userId: number) {
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a helpful AI assistant. Respond to the following user input:
      {input}

      Previous conversation context: {memoryContext}
      Similar past interactions: {vectorContext}
      User ID: {userId}

      Please provide a helpful response using both conversation history and similar past interactions.
    `);

    return RunnableSequence.from([
      {
        input: (input: string) => input,
        memoryContext: async (input: string) => {
          const memories = await this.memoryService.searchMemory(userId, input);
          console.log("Memory Context:", memories);
          return memories.join("\n");
        },
        vectorContext: async (input: string) => {
          const similar = await this.chromaService.findSimilarInputs(userId.toString(), input);
          console.log("Vector Context:", similar);
          return similar.join("\n");
        },
        userId: () => userId.toString(),
      },
      prompt,
      this.model,
      new StringOutputParser(),
    ]);
  }

  async processMessage(input: string, userId: number): Promise<string> {
    try {
      console.log("\n🔄 === Starting Message Processing ===");
      console.log("User Input:", input);
      console.log("User ID:", userId);
      
      const chain = this.createChain(userId);
      
      // Store input in ChromaDB
      console.log("\n📥 Storing input in vector database...");
      await this.chromaService.storeUserInput(userId.toString(), input);
      
      // Get response
      console.log("\n🤖 Generating AI response...");
      const response = await chain.invoke(input);
      
      // Store in memory
      console.log("\n💾 Storing conversation in memory...");
      await this.memoryService.storeConversation(userId, [
        { role: "user", content: input },
        { role: "assistant", content: response }
      ]);
      
      console.log("\n✅ === Processing Complete ===");
      console.log("Final Response:", response);
      console.log("============================\n");
      
      return response;
    } catch (error) {
      console.error("\n❌ Error in message processing:", error);
      return "I apologize, but I encountered an error. Please try again.";
    }
  }
} 