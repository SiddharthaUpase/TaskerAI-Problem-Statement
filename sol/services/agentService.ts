import { 
  StateGraph, 
  START, 
  END 
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda } from "@langchain/core/runnables";
import { ChromaService } from "./chromaService";
import { MemoryService } from "./memoryService";

// Define the agent's state
interface AgentWorkflowState {
  input: string;
  userId: number;
  output?: string;
  memories?: string[];
  searchQuery?: string;
  recentConversation?: { role: string; content: string; }[];
}

export class LangGraphAgentService {
  private model: ChatOpenAI;
  private chromaService: ChromaService;
  private memoryService: MemoryService;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });
    this.chromaService = ChromaService.getInstance();
    this.memoryService = MemoryService.getInstance();
  }

  // Generate search query node
  private generateSearchQuery = async (state: AgentWorkflowState) => {
    const searchQueryChain = PromptTemplate.fromTemplate(
      `Given the user query: "{input}", generate a focused search query 
       to find relevant past conversations or contextual information.`
    )
    .pipe(this.model)
    .pipe(new StringOutputParser());

    const searchQuery = await searchQueryChain.invoke({ 
      input: state.input 
    });

    return { ...state, searchQuery };
  }

  // Search memories node
  private searchMemories = async (state: AgentWorkflowState) => {
    if (!state.searchQuery) {
      return state;
    }

    const chromaFacts = await this.chromaService.findSimilarInputs(
      state.userId.toString(), 
      state.searchQuery
    );
    const mem0Facts = await this.memoryService.searchMemory(
      state.userId, 
      state.searchQuery
    );
    
    const memories = [...chromaFacts, ...mem0Facts];
    return { ...state, memories };
  }

  // Decide if needs facts node
  private createNeedsFactsNode() {
    return RunnableLambda.from(async (state: AgentWorkflowState) => {
      const needsFactsChain = PromptTemplate.fromTemplate(
        `Determine if the query "{input}" requires additional context or facts.
        If its a statement, respond with direct_response.
        If its a question that is related to past experiences, respond with needs_facts.
        Mostly for questions that are related to past experiences, respond with needs_facts.
        Respond with "needs_facts" or "direct_response"`
      )
      .pipe(this.model)
      .pipe(new StringOutputParser());

      const decision = await needsFactsChain.invoke({ 
        input: state.input 
      });

      return decision.trim().toLowerCase() === "needs_facts" 
        ? "needs_facts" 
        : "direct_response";
    });
  }

  // Generate final response node
  private generateFinalResponse = async (state: AgentWorkflowState) => {
    const recentMessages = await this.memoryService.getRecentConversation(
      state.userId, 
      5
    );

    const responseChain = PromptTemplate.fromTemplate(
      `Current conversation:
       ${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

       User Query: {input}
       ${state.memories && state.memories.length > 0 
         ? 'Additional Context:\n' + state.memories.map((fact, i) => `${i + 1}. ${fact}`).join('\n') 
         : ''}
       
       Provide a concise response that maintains conversation continuity and incorporates both the conversation history and any relevant context.
       Make sure you use the context and only answer to the user question don't answer to the conversation history or any other context.
       Do not mention answer that has nothing to do with the user question.
       If the user refers to previous messages, make sure to acknowledge and connect to that context.`
    )
    .pipe(this.model)
    .pipe(new StringOutputParser());

    const output = await responseChain.invoke({
      input: state.input,
      ...(state.memories ? { memories: state.memories.join('\n') } : {})
    });

    return { 
      ...state, 
      output,
      recentConversation: [...recentMessages, { role: 'user', content: state.input }]
    };
  }

  // Create the agent workflow
  createAgentWorkflow() {
    const workflow = new StateGraph<AgentWorkflowState>({
      channels: {
        input: null,
        userId: null,
        output: null,
        memories: null,
        searchQuery: null
      }
    })
    .addNode('start', (state) => state)
    .addNode('generate_search_query', this.generateSearchQuery)
    .addNode('search_memories', this.searchMemories)
    .addNode('generate_response', this.generateFinalResponse)
    .addEdge(START, 'start')
    .addConditionalEdges(
      'start',
      this.createNeedsFactsNode(),
      {
        needs_facts: 'generate_search_query',
        direct_response: 'generate_response'
      }
    )
    .addEdge('generate_search_query', 'search_memories')
    .addEdge('search_memories', 'generate_response')
    .addEdge('generate_response', END);

    return workflow.compile();
  }

  // Main processing method
  async process(userId: number, userInput: string): Promise<string> {
    try {
      await this.memoryService.initializeUser(userId);
      const workflow = this.createAgentWorkflow();
      const result = await workflow.invoke({
        input: userInput,
        userId: userId
      });

      await this.storeConversation(userId, userInput, result.output);
      return result.output || "I couldn't generate a response.";
    } catch (error) {
      throw error;
    }
  }

  // Helper method to determine if conversation should be stored
  private async shouldStoreConversation(
    input: string,
    response: string
  ): Promise<boolean> {
    const analysisChain = PromptTemplate.fromTemplate(
      `Analyze if this conversation contains new facts or important information worth storing:
       User: {input}
       Assistant: {response}
       
       Respond with only "store" or "skip". Choose "store" if:
       1. Contains new personal information
       2. Includes factual statements
       3. References past experiences
       4. Contains preferences or opinions
       Choose "skip" for general chit-chat or basic queries.
       Skip if its a basic question or a question that can be answered by a search.
       
       If the response is a basic question or a question that can be answered by a search, choose "skip".
       `
    )
    .pipe(this.model)
    .pipe(new StringOutputParser());

    const decision = await analysisChain.invoke({
      input,
      response
    });

    return decision.trim().toLowerCase() === "store";
  }

  // Modified store conversation method
  private async storeConversation(
    userId: number, 
    userInput: string, 
    agentResponse: string
  ) {
    if (await this.shouldStoreConversation(userInput, agentResponse)) {
      await Promise.all([
        this.chromaService.storeUserInput(userId.toString(), userInput),
        this.memoryService.storeConversation(userId, [
          { role: 'user', content: userInput },
          { role: 'assistant', content: agentResponse }
        ])
      ]);
    }
  }
}