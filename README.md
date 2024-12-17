# Problem Statement: Knowledge Memory

We are interested in building an AI agent that can engage in a conversation with a user, remember important facts from previous interactions, and autonomously retrieve factual information it has seen before. The objective is to leverage **Chroma DB** for vector-based memory storage and **Mem0** for graph-based memory representation, ensuring the agent maintains an evolving context over multiple turns. You will use **Typescript**, **Langchain**, and **Langgraph** to construct this solution.

## Key References
- [ChromaDB](https://github.com/chroma-core/chroma)
- [Mem0.ai](https://mem0.ai)
- [LangGraphJS](https://langgraphjs.com/)
- [LangchainJS](https://js.langchain.com/)

## Technology Stack
- **Typescript**: Main programming language for the implementation (refer to the provided template).
- **Chroma DB**: For vector-based fact embedding and retrieval (deploy local docker container).
- **Memzero**: For managing a graph-based memory structure that can store and relate facts.
- **Langchain**: For connecting LLM capabilities to our data sources and building the agent’s reasoning pipeline.
- **Langgraph**: For defining a simple graph-based flow that includes a single agent node.

## Core Requirements

### Embedding Strategy (C)
- Implement a text embedding pipeline for converting pieces of factual data into vector form.
- Store these vector embeddings in Chroma DB, associating each embedding with relevant metadata (e.g., source, context, or timestamp).

### Memory Integration with Memzero
- Integrate Memzero to create and manage a knowledge graph that maintains relationships between facts.
- As the agent interacts with the user, new facts should be inserted into both the vector database (Chroma DB) and the graph memory (Memzero), allowing for both semantic and relational retrieval of information.

### Self-Querying Capability
- Implement a single Langgraph agent node (graph structure: `Start → Agent → End`) that can handle user queries.
- The agent should be able to:
  - Take a user query and determine if additional facts are needed.
  - Automatically craft a query to search Chroma DB for relevant facts.
  - Retrieve the top-k most relevant documents/facts from the vector database.
  - Use Memzero’s memory graph to relate newly found facts to previously known facts, enriching the conversation context and enabling more coherent answers.

### Conversational Flow and Fact Memorization
- The agent should maintain context across multiple user turns, effectively “remembering” previously mentioned facts.
- Demonstrate that the agent, over the course of a conversation, can recall, refine, and relate facts learned in earlier turns without losing track of context.

## Evaluation & Documentation
- Provide a short demonstration scenario (e.g., a conversational script) showing how the agent learns and then recalls facts introduced during earlier turns of the conversation.
- Evaluate the agent’s performance qualitatively (e.g., does it correctly remember and use previously mentioned facts?).
- Document your approach, including through code comments.

## Deliverables
- **Code Repository** (e.g., GitHub):
  - Typescript code implementing the agent with Langchain and Langgraph.
  - Integration scripts for embedding generation and Chroma DB indexing.
  - Code demonstrating Memzero-based graph memory construction and querying.
  - A clear README detailing how to set up, run, and test the system.

## Assessment Criteria
- **Technical Correctness**: Proper use of Typescript, Langchain, Langgraph, Chroma DB, and Memzero.
- **Functionality**: The agent can engage in conversation, remember facts, and retrieve them when asked.
- **Code Quality**: Clean, maintainable, and well-documented code.
- **Rationale & Scalability**: Thoughtful explanation of design choices, embedding strategies, and awareness of how the system might scale.

