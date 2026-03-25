import serverless from "serverless-http";
import { createServer } from "../../server";

let serverlessHandler: any;

export const handler = async (event: any, context: any) => {
  console.log("Netlify Function Handler hit!");
  console.log("Event path:", event.path);
  console.log("Event method:", event.httpMethod);
  
  try {
    if (!serverlessHandler) {
      console.log("Initializing serverless handler...");
      const app = await createServer();
      serverlessHandler = serverless(app);
      console.log("Serverless handler initialized.");
    }
    return await serverlessHandler(event, context);
  } catch (err: any) {
    console.error("Netlify Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Netlify Function Error",
        message: err?.message || "Unknown error",
        stack: err?.stack
      })
    };
  }
};
