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
      
    } catch (error) {
      console.error("Error initializing user session:", error);
    }
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

} 