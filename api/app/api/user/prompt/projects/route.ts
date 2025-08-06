// GENERATE PROJECTS

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
    //  Get body
    const body = request.json();
    const { userProfile, technologies } = await body;

    // Create prompt
    const prompt = `
            Generate realistic project data for a professional portfolio.
            ${
              userProfile
                ? `User context:
                Name: ${userProfile.name},
                Title: ${userProfile.title},
                Bio: ${userProfile.bio}
                `
                : ""
            }
             ${
               technologies
                 ? `Preferred technologies: ${technologies.join(",")}`
                 : ""
             }

             Generate 3-4 projects that showcase different skills and technologies. Return a JSON array with this exact structure:
             [
                {
             "_id": "unique_id_1",
             "title": "Project Name",
             "description": "Detailed project description explaining what it does, key features, and impact",
             "thumbnail": "https://images.unsplash.com/photo-1548869447-faef5000334c",
             "demoUrl": "https://projectname.com",
             "githubUrl":"https://github.com/username/projectname",
             "technologies": ["React", "TypeScript", "Tailiwnd CSS"],
             "isFeatured": true
             }
             ]

             Make sure:
             - Project names are creative but professional
             - Descriptions are 2-3 sentences explaining purpose and key features
             - Use relevant Unplash images for thumbnails (tech/coding related)
             - Demo URLs should be realistic project names
             - Github URLs should follow proper format
             - Technologies should be relevant and modern
             - Mark 1-2 projects as features (isFeatured: true)
             - Include a mix of web apps, tools, and platforms
             - Each project should have 3-6 technologies
             - Descriptions should highlight problem-solving and impact

             Return only valid JSON, no additional text
        `;

    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt,
    });

    const projectData = JSON.parse(text);
    return NextResponse.json({
      success: true,
      data: projectData,
    });
  } catch (error) {
    devLog.error("Error while generating projects data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate projects data",
      },
      {
        status: 500,
      }
    );
  }
}
