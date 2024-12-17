import { AgentService } from "./services/agentService";
import { ChromaService } from "./services/chromaService";

export async function solution(input: string, userId: number): Promise<string> {
  console.log("\n🔄 === Starting Message Processing ===");
  console.log("User Input:", input);
  console.log("User ID:", userId);

  try {
    // Process with AgentService (storage decision is now handled inside)
    const agentService = AgentService.getInstance();
    const response = await agentService.process(userId.toString(), input);

    console.log("\n✅ === Message Processing Complete ===\n");
    return response;

  } catch (error) {
    console.error("\n❌ Error processing message:", error);
    return "I apologize, but I encountered an error processing your message.";
  }
}

export async function initializeUserSession(userId: number, userName: string) {
  console.log(`\n🚀 Initializing session for user ${userName} (ID: ${userId})`);
  
  try {
    // Store initial greeting in ChromaDB
    const initialMessage = `I am ${userName}`;
    await ChromaService.getInstance().storeUserInput(userId.toString(), initialMessage);
    
    console.log("✅ Session initialized successfully\n");
  } catch (error) {
    console.error("❌ Error initializing session:", error);
    throw error;
  }
}
