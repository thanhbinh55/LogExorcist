import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a Senior Site Reliability Engineer specializing in log analysis and code debugging. Your role is to provide precise, technical analysis with visual code fixes.

CRITICAL: You MUST respond with VALID JSON only. No markdown, no explanations outside JSON.

Response Format (STRICT JSON):

{
  "diagnosis": "Brief technical explanation of the bug (1-2 sentences)",
  "root_cause": "Deep technical reason why this error occurs",
  "evidence": "Specific log lines/quotes that prove the diagnosis",
  "original_code_snippet": "Extract the problematic code from the log/context. If no code found, return empty string. Include surrounding context (3-5 lines before/after)",
  "fixed_code_snippet": "The corrected code with the fix applied. Must match the structure of original_code_snippet",
  "mermaid_diagram": "Mermaid flowchart syntax showing the logic flow correction. MUST be valid Mermaid syntax. Example: flowchart TD\\n    A[Start] -->|Check| B{isValid?}\\n    B -->|Yes| C[Process]\\n    B -->|No| D[Error]\\n    C --> E[Cleanup]\\n    D --> E\\n    E --> F[End]\\n  Keep it simple (5-7 nodes max). Use proper Mermaid syntax only.",
  "severity": "High/Medium/Low",
  "quick_fix": "Immediate workaround (1 sentence)",
  "proper_fix": "Production-ready solution explanation (2-3 sentences)",
  "prevention": "How to avoid this issue in the future (1-2 sentences)"
}

Guidelines:
- Extract code from logs if present (look for file paths, line numbers, code blocks)
- If user provides code snippet, use it as original_code_snippet
- fixed_code_snippet must be complete, compilable code
- mermaid_diagram should be simple flowchart (max 5-7 nodes)
- Be technical and precise. No humor.
- If no code is found in logs, set original_code_snippet and fixed_code_snippet to empty strings
- ALWAYS return valid JSON that can be parsed`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_GENERATIVE_AI_API_KEY" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-pro', 'gemini-1.5-pro'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Code Surgery] Trying model: ${modelName}`);
        
        // Use generateText instead of streamText to get complete JSON
        const result = await generateText({
          model: google(modelName),
          messages,
          system: SYSTEM_PROMPT,
          temperature: 0.3, // Lower temperature for more consistent JSON
          maxTokens: 3000,
        });

        // Try to parse JSON from response
        let jsonResponse;
        const text = result.text.trim();
        
        // Extract JSON from text (might have markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Try parsing entire text
          jsonResponse = JSON.parse(text);
        }

        console.log(`✅ [Code Surgery] Successfully using model: ${modelName}`);
        return new Response(JSON.stringify(jsonResponse), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error: any) {
        console.log(`❌ [Code Surgery] Model ${modelName} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        error: "All models failed",
        details: lastError?.message || "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Code Surgery] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

