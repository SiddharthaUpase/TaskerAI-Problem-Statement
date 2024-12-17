import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChromaService } from "./chromaService";
import { StringOutputParser } from "@langchain/core/output_parsers";

export class AgentService {
  private static instance: AgentService;
  private model: ChatOpenAI;
  private chromaService: ChromaService;

  private constructor() {
    console.log("\n🔧 Initializing AgentService...");
    try {
      this.model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
      });
      this.chromaService = ChromaService.getInstance();
      console.log("✅ AgentService initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AgentService:", error);
      throw error;
    }
  }

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  private async shouldStoreInput(input: string): Promise<boolean> {
    console.log("\n🤔 Evaluating if input should be stored...");
    
    const evaluationChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        `Analyze the following input and determine if it contains new factual information worth storing.
         Only respond with "YES" if the input contains:
         - New facts about the user
         - Important information that might be referenced later
         - Statements (not questions)
         - Personal details or preferences
         
         Respond with "NO" if the input is:
         - A question
         - Small talk
         - Greetings
         - Commands or requests
         - Clarifications
         
         Input: "{input}"
         Should this be stored (YES/NO)?`
      ),
      this.model,
      new StringOutputParser(),
    ]);

    const result = await evaluationChain.invoke({
      input: input,
    });

    const shouldStore = result.trim().toUpperCase() === "YES";
    console.log(`📝 Storage Decision: ${shouldStore ? "Will store" : "Will not store"}`);
    return shouldStore;
  }

  async process(userId: string, userInput: string): Promise<string> {
    console.log("\n🔄 === Starting Agent Processing ===");
    console.log("📝 User Input:", userInput);
    console.log("👤 User ID:", userId);

    try {
      // 1. Evaluate if input should be stored
      const shouldStore = await this.shouldStoreInput(userInput);
      if (shouldStore) {
        console.log("\n💾 Storing valuable information in database...");
        await this.chromaService.storeUserInput(userId, userInput);
      }

      // 2. Determine if we need to search for facts
      console.log("\n🔍 Step 1: Determining if facts are needed...");
      const needsFactsChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          `Given the user query: "{input}", determine if we need to search for additional facts from the database. 
           Respond with either "YES" or "NO".
           Respond YES if the query seems to be a question or a request for information.`
        ),
        this.model,
        new StringOutputParser(),
      ]);

      const needsFacts = await needsFactsChain.invoke({
        input: userInput,
      });
      console.log("📊 Needs Facts:", needsFacts.trim());

      let relevantFacts: string[] = [];
      if (needsFacts.trim().toUpperCase() === "YES") {
        // 3. Generate search query
        console.log("\n🔎 Step 2: Generating search query...");
        const searchQueryChain = RunnableSequence.from([
          PromptTemplate.fromTemplate(
            `Given the user query: "{input}", generate a search query that would help find relevant past conversations or facts.
             Make the search query specific and focused on key information needed.`
          ),
          this.model,
          new StringOutputParser(),
        ]);

        const searchQuery = await searchQueryChain.invoke({
          input: userInput,
        });
        console.log("🔎 Generated Search Query:", searchQuery);

        // 4. Search ChromaDB for relevant facts
        console.log("\n📚 Step 3: Searching for relevant facts...");
        relevantFacts = await this.chromaService.findSimilarInputs(userId, searchQuery);
        console.log("📑 Found Facts:", relevantFacts.length > 0 ? relevantFacts : "No facts found");
      }

      // 5. Generate response using found facts
      console.log("\n💭 Step 4: Generating final response...");
      const responseChain = RunnableSequence.from([
        PromptTemplate.fromTemplate(
          `User Query: {input}
           ${relevantFacts.length > 0 ? 'Relevant Past Context:' : ''}
           ${relevantFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}
           
           Please provide a response to the user query, incorporating any relevant past context naturally.
           If there's no past context, simply respond to the query directly.`
        ),
        this.model,
        new StringOutputParser(),
      ]);

      const response = await responseChain.invoke({
        input: userInput,
      });

      console.log("✅ === Agent Processing Complete ===");
      return response;

    } catch (error) {
      this.logError("agent processing", error);
      throw new Error("Agent processing failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  private logError(stage: string, error: unknown) {
    console.error(`\n❌ Error in ${stage}:`);
    console.error("Details:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("======================\n");
  }
}
