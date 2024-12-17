import { LangGraphAgentService } from "./services/agentService";

// Custom error for agent processing
class AgentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentProcessingError";
  }
}

export async function solution(input: string, userId: number): Promise<string> {
  console.log("\n🔄 === Starting Message Processing ===");
  console.log("User Input:", input);
  console.log("User ID:", userId);

  try {
    // Validate input
    if (!input.trim()) {
      throw new AgentProcessingError("Empty input provided");
    }

    // Validate userId
    if (typeof userId !== 'number' || userId < 0) {
      throw new AgentProcessingError("Invalid user ID");
    }

    const agentService = new LangGraphAgentService();
    const response = await agentService.process(userId, input);

    console.log("\n✅ === Message Processing Complete ===");
    console.log("Response Length:", response.length);
    
    return response;

  } catch (error) {
    console.error("\n❌ Error processing message:", error);
    
    if (error instanceof AgentProcessingError) {
      return `Input validation error: ${error.message}`;
    }
    
    return "I apologize, but I encountered an unexpected error processing your message.";
  }
}

export async function initializeUserSession(userId: number, userName: string) {
  console.log(`\n🚀 Initializing session for user ${userName} (ID: ${userId})`);
  
  try {
    // Validate inputs
    if (!userName || userName.trim() === "") {
      throw new AgentProcessingError("Invalid username");
    }

    if (typeof userId !== 'number' || userId < 0) {
      throw new AgentProcessingError("Invalid user ID");
    }

    const agentService = new LangGraphAgentService();
    const initMessage = `I am ${userName}, and this is the start of my session.`;
    
    await agentService.process(userId, initMessage);
    
    console.log("✅ Session initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing session:", error);
    
    if (error instanceof AgentProcessingError) {
      console.error(`Session initialization failed: ${error.message}`);
    }
    
    throw error;
  }
}

// Optional: Add a health check function
export function agentServiceHealthCheck(): boolean {
  try {
    // You could add more comprehensive checks here
    const agentService = new LangGraphAgentService();
    return agentService !== null;
  } catch {
    return false;
  }
}