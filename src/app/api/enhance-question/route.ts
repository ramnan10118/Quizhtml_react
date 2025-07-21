import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Define the schema for enhanced questions
const EnhancedQuestionSchema = z.object({
  enhancedQuestion: z.object({
    text: z.string().min(1),
    options: z.array(z.string().min(1)).min(4).max(4),
    correct: z.number().int().min(0).max(3)
  })
});

const enhancementPrompts = {
  grammar: `Fix any grammatical errors, improve sentence structure, and ensure proper punctuation while maintaining the exact same meaning and difficulty level.`,
  simplify: `Simplify the language to make it more accessible while keeping the same difficulty level. Use simpler words and shorter sentences where possible.`,
  clarity: `Improve the clarity and precision of the question. Make it more specific, remove ambiguity, and ensure the question is crystal clear.`
};

export async function POST(request: NextRequest) {
  try {
    const { question, enhancementType } = await request.json();

    if (!question || !enhancementType) {
      return NextResponse.json(
        { error: 'Missing required fields: question, enhancementType' },
        { status: 400 }
      );
    }

    if (!['grammar', 'simplify', 'clarity'].includes(enhancementType)) {
      return NextResponse.json(
        { error: 'Invalid enhancement type. Must be one of: grammar, simplify, clarity' },
        { status: 400 }
      );
    }

    // Validate question structure
    if (!question.text || !Array.isArray(question.options) || question.options.length !== 4 || typeof question.correct !== 'number') {
      return NextResponse.json(
        { error: 'Invalid question format' },
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

    console.log('Enhancing question with type:', enhancementType);
    
    const enhancementPrompt = enhancementPrompts[enhancementType as keyof typeof enhancementPrompts];
    
    const result = await generateObject({
      model: openai('gpt-3.5-turbo'),
      schema: EnhancedQuestionSchema,
      prompt: `You are a quiz question enhancement specialist. Your task is to enhance the following multiple choice question based on the specific enhancement type requested.

ENHANCEMENT TYPE: ${enhancementType}
ENHANCEMENT GOAL: ${enhancementPrompt}

ORIGINAL QUESTION:
Text: "${question.text}"
Options: ${JSON.stringify(question.options)}
Correct Answer Index: ${question.correct} (which is: "${question.options[question.correct]}")

STRICT REQUIREMENTS:
1. PRESERVE THE MEANING: The enhanced question must test the exact same knowledge/concept
2. PRESERVE DIFFICULTY: Don't make it easier or harder
3. PRESERVE CORRECT ANSWER: The same option must remain correct (you can improve the wording but the meaning must stay the same)
4. PRESERVE OPTION COUNT: Must have exactly 4 options
5. PRESERVE OPTION STRUCTURE: Keep the same type of answer choices (if they were single words, keep them as single words; if they were phrases, keep them as phrases)

QUALITY REQUIREMENTS:
- Enhanced question text must end with a question mark
- All options must be plausible but distinguishable
- Language should be appropriate for a quiz setting
- Avoid overly complex vocabulary unless the topic demands it

RESPONSE FORMAT:
Return a JSON object with an "enhancedQuestion" object containing:
- "text": The enhanced question string
- "options": Array of exactly 4 enhanced option strings  
- "correct": The correct answer index (0-3)

Remember: The goal is to improve the ${enhancementType} while keeping everything else essentially the same.`,
      temperature: 0.3,
      maxRetries: 2,
    });

    console.log('Question enhancement successful');

    return NextResponse.json({
      success: true,
      enhancedQuestion: result.object.enhancedQuestion,
      enhancementType,
      originalQuestion: question,
      enhancedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error enhancing question:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
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

      return NextResponse.json(
        { error: `Enhancement failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to enhance question. Please try again.' },
      { status: 500 }
    );
  }
}