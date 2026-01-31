import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createFinancialAnalysisPrompt } from "../prompts/financialAnalysisPrompt";
import { createCompactFinancialPrompt } from "../prompts/financialAnalysisPromptCompact";
import { createStructuredFinancialPrompt } from "../prompts/financialAnalysisPromptStructured";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!API_KEY) {
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export type PromptType = "compact" | "structured" | "full";

const promptBuilders: Record<PromptType, (data: string) => string> = {
  compact: createCompactFinancialPrompt,
  structured: createStructuredFinancialPrompt,
  full: createFinancialAnalysisPrompt,
};

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { financialData, promptType = "structured" } = body as {
      financialData: string;
      promptType?: PromptType;
    };

    if (!financialData) {
      return NextResponse.json(
        { error: "financialData is required" },
        { status: 400 }
      );
    }

    const buildPrompt = promptBuilders[promptType] || promptBuilders.structured;
    const prompt = buildPrompt(financialData);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // For structured/full prompt, try to parse JSON from response
    if (promptType === "structured" || promptType === "full") {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ type: promptType === "full" ? "full" : "structured", data: parsed });
        }
      } catch {
        // Fall through to text response if JSON parsing fails
      }
    }

    return NextResponse.json({ type: "text", data: text });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
