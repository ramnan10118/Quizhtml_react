import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { logTopicToSheets } from '@/lib/sheets';
import { randomUUID } from 'crypto';

// Define the schema for generated questions
const QuestionSchema = z.object({
  questions: z.array(z.object({
    text: z.string().min(1),
    options: z.array(z.string().min(1)).min(4).max(4),
    correct: z.number().int().min(0).max(3)
  }))
});

export async function POST(request: NextRequest) {
  const sessionId = randomUUID();
  const timestamp = new Date().toISOString();
  let topic = 'Unknown';
  let difficulty = 'Unknown';
  let questionCount = 0;
  
  try {
    const requestData = await request.json();
    topic = requestData.topic;
    difficulty = requestData.difficulty;
    questionCount = requestData.questionCount;

    if (!topic || !difficulty || !questionCount) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, difficulty, questionCount' },
        { status: 400 }
      );
    }

    if (questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Generate questions using AI
    console.log('Generating questions with params:', { topic, difficulty, questionCount });
    
    const result = await generateObject({
      model: openai('gpt-3.5-turbo'),
      schema: QuestionSchema,
      prompt: `You are a quiz question generator. Generate exactly ${questionCount} multiple choice questions about "${topic}" with ${difficulty} difficulty.

STRICT FORMAT REQUIREMENTS:
- Return a JSON object with a "questions" array
- Each question must have: "text", "options", "correct"
- "text": A clear question string ending with ?
- "options": Array of exactly 4 strings (answer choices)
- "correct": Integer from 0-3 indicating correct option index

QUALITY REQUIREMENTS:
- Questions should be ${difficulty.toLowerCase()} difficulty
- Options should be plausible but distinguishable
- Only one correct answer per question
- Questions should be clear and unambiguous

EXAMPLE FORMAT:
{
  "questions": [
    {
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correct": 2
    }
  ]
}

Generate ${questionCount} questions about: ${topic}
Difficulty: ${difficulty}`,
      temperature: 0.7,
      maxRetries: 2,
    });

    console.log('AI generation successful, questions count:', result.object.questions.length);

    // Log successful topic generation to Google Sheets
    await logTopicToSheets({
      timestamp,
      topic,
      difficulty,
      questionCount,
      success: true,
      sessionId
    });

    return NextResponse.json({
      success: true,
      questions: result.object.questions,
      metadata: {
        topic,
        difficulty,
        questionCount,
        generatedAt: timestamp
      }
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: !!process.env.OPENAI_API_KEY ? 'API key present' : 'API key missing'
    });

    // Log failed topic generation to Google Sheets
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logTopicToSheets({
      timestamp,
      topic,
      difficulty,
      questionCount,
      success: false,
      errorMessage,
      sessionId
    });
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid or missing OpenAI API key' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `Generation failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    );
  }
}