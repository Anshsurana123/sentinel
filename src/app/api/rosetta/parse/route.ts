import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const systemInstruction = `You are a physics-to-calculus translation engine. When given a physics equation, return ONLY a valid JSON object with no markdown, no preamble, no explanation outside the JSON.
Return this exact shape:
{
  "physics_form": "the original equation in LaTeX",
  "calculus_form": "the full calculus/derivative form in LaTeX",
  "components": [
    {
      "symbol": "F",
      "meaning": "Net Force",
      "unit": "Newtons (N)",
      "calculus_role": "The result of mass times the second derivative of position"
    }
  ],
  "graph_config": {
    "type": "position_time" | "velocity_time" | "force_displacement" | "oscillation",
    "x_label": "Time (s)",
    "y_label": "Position (m)",
    "equation_js": "Math.sin(t) * amplitude"
  },
  "simulation_type": "pendulum" | "spring" | "projectile" | "none",
  "plain_english": "One sentence explanation of what this equation physically means"
}`;

export async function POST(req: NextRequest) {
  try {
    const { equation } = await req.json();

    if (!equation) {
      return NextResponse.json({ error: "Missing equation" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY is missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(equation);
    const text = result.response.text();

    // Strip out Markdown fences if the model included them
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json/, "");
      jsonStr = jsonStr.replace(/```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/, "");
      jsonStr = jsonStr.replace(/```$/, "");
    }

    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", jsonStr);
      return NextResponse.json({ error: "Failed to parse API response. Invalid format returned." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Rosetta API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
