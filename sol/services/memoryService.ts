import MemoryClient from "mem0ai";
import { IMessage } from "./types";

export class MemoryService {
  private static instance: MemoryService;
  private userMemories: Map<number, MemoryClient> = new Map();

  private constructor() {}

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  async initializeUser(userId: number): Promise<void> {
    try {
      const memory = new MemoryClient({
        apiKey: process.env.MEM0_API_KEY || "",
      });
      
      this.userMemories.set(userId, memory);
      
      // Store initial user context
      await this.storeInitialContext(userId);
    } catch (error) {
      console.error("Error initializing user session:", error);
    }
  }

  private async storeInitialContext(userId: number): Promise<void> {
    const memory = this.userMemories.get(userId);
    if (!memory) return;

    const initialContext = [
      { role: "system", content: "Location: Lives in Paris" },
      { role: "system", content: "Occupation: Startup Founder" },
      { role: "system", content: "Achievement: Raised $20 million in funding" },
      { role: "system", content: "Professional Status: Successful entrepreneur" },
      { role: "system", content: "Current City: Paris, France" },
      { role: "system", content: "Career: Tech entrepreneur and founder" },
      { role: "system", content: "Business Achievement: Successfully secured Series A funding of $20M" },
      { role: "system", content: "Lifestyle: Based in the startup ecosystem of Paris" }
    ];

    await memory.add(initialContext, { user_id: userId.toString() });
  }

  async searchMemory(userId: number, query: string): Promise<string[]> {
    try {
      const memory = this.userMemories.get(userId);
      if (!memory) return [];
      
      const results = await memory.search(query, { user_id: userId.toString() });
      return results.map(result => result.memory || "").filter(Boolean) as string[];
    } catch (error) {
      console.error("Error searching memory:", error);
      return [];
    }
  }

  async storeConversation(userId: number, messages: IMessage[]): Promise<void> {
    try {
      const memory = this.userMemories.get(userId);
      if (!memory) return;
      
      await memory.add(messages, { user_id: userId.toString() });
    } catch (error) {
      console.error("Error storing conversation:", error);
    }
  }

  async clearAll(): Promise<void> {
    // Clear the memory map
    this.userMemories.clear();
  }
} 