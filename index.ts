import * as dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import * as readline from "readline";
import { solution, initializeUserSession } from "./sol";

async function question(r: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    r.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

export interface IUser {
  id: number;
  name: string;
}

// Main
(async () => {
  const r = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const USERS: IUser[] = [
    {
      id: 0,
      name: "James",
    },
    {
      id: 1,
      name: "Jane",
    },
    {
      id: 2,
      name: "Mo",
    },
  ];

  try {
    let selectedUser: IUser | undefined;

    // I - UserSelection
    while (true) {
      const userInput = await question(
        r,
        "SelectUser: " +
          USERS.map((user) => `[${user.id}] ${user.name}`).join(" | ") +
          " : ",
      );
      const userId = parseInt(userInput);
      if (userId >= 0 && userId < USERS.length) {
        selectedUser = USERS[userId];
        break;
      }

      console.log("ERROR: user not found");
    }

    if (!selectedUser) {
      throw new Error("No User Selected");
    }

    // Initialize session for the selected user
    await initializeUserSession(selectedUser.id,selectedUser.name);

    // II - Chatbot
    while (true) {
      const userInput = await question(r, `${selectedUser.name}: `);

      // AI Response - pass both input and userId
      console.log(`AI: ${await solution(userInput, selectedUser.id)}\n\n`);

      // Should Stop ??
      const continueAnswer = await question(
        r,
        "Do you want to stop? (yes/no): ",
      );

      if (
        continueAnswer.toLowerCase() === "yes" ||
        continueAnswer.toLowerCase() === "y"
      ) {
        // Break out
        break;
      }

      console.log("Continuing...");
      console.log("\n========================================\n\n");
    }
  } catch (error: unknown) {
    console.error(error);
  } finally {
    r.close();
  }
})();
