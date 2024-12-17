// Define interfaces and types
export interface IMemoryResult {
  id: string;
  memory: string;
  user_id: string;
  hash: string;
  metadata: any;
  categories: string[];
  created_at: string;
  updated_at: string;
  score: number;
}

export interface IMessage {
  role: string;
  content: string;
}

export interface IEmbedding {
  id: string;
  text: string;
  metadata?: {
    userId?: string;
    timestamp?: string;
    source?: string;
    type?: string;
  };
}

export interface IVectorStore {
  collectionName: string;
  embedding: IEmbedding;
}

export interface AgentState {
  messages: Array<{ role: string; content: string }>;
  userId: string;
}

export interface AgentResponse {
  needsMoreFacts: boolean;
  factQuery?: string;
  reasoning: string;
  response: string;
  additionalContext?: string[];
}

export interface AgentAnalysis {
  hasEnoughContext: boolean;
  missingInformation?: string[];
  confidence: number;
  sources: {
    memory: boolean;
    vectorStore: boolean;
  };
} 