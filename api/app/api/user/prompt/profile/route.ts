// FILL PROFILE FORM WITH AI

import { devLog } from "@/lib/utils";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

// Create deepseek client
const deepseek = createOpenAI({
  name: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseURL: "https://api.deepseek.com/v1",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { industry, role } = body;

    const prompt = `Generate realistic professional profile data for a portfolio.
            ${industry ? `Industry: ${industry}` : ""}
            ${role ? `Role: ${role}` : ""}

            Generate a professional profile with this exact JSON structure:
            {
                "name": "Full name",
                "title": "Professional Title",
                "bio": "Professional bio (2-3 sentences about experience, skills, and passion)",
                "email": "professional.email@example.com",
                "phone":"+1 555-XXX-XXX",
                "location": "City, State",
                "website":"https://personalwebsite.com",
                "profilePhoto": "https://images.unsplash.com/photo-1742201949674-a5084b01418c?w=500",
                "socialMedia": [
                {
                    "platform": "Linkedin",
                    "url":"https://linkedin.com/in/username"
                },
                {
                    "platform": "Github",
                    "url":"https://github.com/username"
                },
                {
                    "platform": "Twitter",
                    "url":"https://twitter.com/username"
                }
                ]
            }

            Make sure:
            - Name sounds professional and realistic
            - Title matches the industry/role if provided
            - Bio is engaging and highlights key strengths
            - Email uses a professional format
            - Phone number uses US format
            - Location is a real city
            - Website URL is realistic
            - Use a professional headshot from Unplash
            - Include 2-3 relevant social media platforms
            - All URLs should be realistic but don't need to be real

            Return only valid JSON, no additional text.
        `;

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt,
    });

    //parse the generated text as JSON
    const portfolioData = JSON.parse(text);

    return NextResponse.json({
      success: true,
      data: portfolioData,
    });
  } catch (error) {
    devLog.error("Error while generating profile data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate profile data",
      },
      {
        status: 500,
      }
    );
  }
}
