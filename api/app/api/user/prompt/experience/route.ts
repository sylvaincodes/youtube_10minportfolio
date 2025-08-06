// GENERATE PROMPT PORTFOLIO EXPERIENCE

import { devLog } from "@/lib/utils";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

// Create Deepseek client
const deepseek = createOpenAI({
  name: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
  baseURL: "https://api.deepseek.com/v1",
});

export async function POST(request: NextRequest) {
  try {
    // Get body
    const body = await request.json();
    const { userProfile } = body;

    // Create prompt
    const prompt = `
            Generate realistic work experience data for a professional portfolio.
            ${
              userProfile
                ? `User profile context:
                Name: ${userProfile.name},
                Title: ${userProfile.title}
                Bio: ${userProfile.bio}
                `
                : ""
            }

                Generate 2-3 work experiences that are realistic and relevant. Return a JSON array with this exact structure:
                [
                {
                    "_id": "unique_id_1",
                    "title": "Job Title",
                    "company" "Company name",
                    "location": "City, State/Country",
                    "startDate": "2021-05-01T00:00:00.000Z"
                    "endDate":   "2023-05-01T00:00:00.000Z",
                    "isCurrent" false,
                    "description": "Detailed job description with responsibilities and impact",
                    "achievements": [
                    "Specific achievement with metrics",
                    "Specific achievement with quantifiable results",
                    "Third achievement showing impact",
                    ],
                    "technologies": ["React","TypeScript","MongoDB"]
                }
                ]

                Make sure:
                - Use realistic job titles and company names
                - Include specific, measurable achievements
                - Add relevant technologies for each role
                - Make dates chronologically consistent
                - One experience can have "isCurrent": true with "endDate": null
                - Descriptions should be 2-3 sentences
                - Each role should have 2-4 achievements
                - Technologies should be relevant to the role

                Return only valid JSON, no addtional text.
        `;

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt,
    });

    // Parse the text
    const experienceData = JSON.parse(text);

    return NextResponse.json(
      {
        success: true,
        data: experienceData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Error while generating experience data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate experience data",
      },
      {
        status: 500,
      }
    );
  }
}
