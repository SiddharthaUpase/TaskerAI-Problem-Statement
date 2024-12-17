# AI Memory Assistant

Welcome to the AI Memory Assistant, an intelligent conversational AI system designed to maintain context and remember past interactions using a dual memory system. This project is built with TypeScript, LangChain, and LangGraph.

## Key Features

- **Context Maintenance**: Retains conversation context across multiple interactions.
- **Intelligent Memory Management**: Efficient storage and retrieval of memories.
- **Semantic Search**: Capable of searching for semantically similar past interactions.
- **Contextually Aware Responses**: Generates responses that consider previous conversations.
- **Selective Memory Storage**: Decides what information is worth storing for future interactions.

## Architecture Overview

### Core Components
1. **Dual Memory System**
   - **ChromaDB**: A vector database used for semantic search.
   - **Mem0**: Manages conversation history and relationship storage.

2. **LangGraph Workflow**
   - Context analysis
   - Memory retrieval
   - Response generation
   - Selective storage of information

### Tech Stack
- TypeScript
- LangChain
- LangGraph
- OpenAI GPT-3.5
- ChromaDB
- Mem0.ai

## Setup Instructions

To get started with the AI Memory Assistant, follow these steps:

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory with the following content:
   ```plaintext
   OPENAI_API_KEY=your_openai_api_key
   MEM0_API_KEY=your_mem0_api_key
   ```

3. **Install Dependencies**
   Run the following command to install the necessary dependencies:
   ```bash
   npm install
   ```

4. **Setup ChromaDB**
  Make sure you have docker installed and running.
   Start ChromaDB by executing these commands:
   ```bash
   docker pull chromadb/chroma
   docker run -p 8000:8000 chromadb/chroma
   ```

5. **Run the Application**
   Finally, start the application with:
   ```bash
   npm start
   ```

## How It Works

1. **Input Processing**
   - The system analyzes user input to determine context requirements.
   - It decides whether to retrieve past memories based on the input.

2. **Memory Retrieval**
   - Searches ChromaDB for semantically similar past interactions.
   - Retrieves recent conversation context from Mem0.

3. **Response Generation**
   - Combines the current input with retrieved context to generate responses.

4. **Memory Storage**
   - Intelligently determines which information to store for future reference.
   - Maintains both semantic and conversational memory.

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (version 14 or higher)
- Docker (for running ChromaDB)
- OpenAI API key
- Mem0 API key

## Error Handling

If you encounter issues, here are some common problems and their solutions:
- **ChromaDB Connection Issues**: Ensure the Docker container is running.
- **Memory Retrieval Failures**: Check your Mem0 API key and network connectivity.
- **OpenAI Errors**: Verify your API key and check for rate limits.

For further assistance, consult the documentation or reach out to me at supase@hawk.iit.edu

