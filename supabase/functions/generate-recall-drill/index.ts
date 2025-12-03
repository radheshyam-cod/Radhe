import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { concept, learningContent } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    console.log('Generating active recall drill for:', concept);

    // Generate 3 quick recall questions using GPT-5
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating active recall questions. Generate 3 quick questions that force students to recall key information without hints. Questions should be direct, specific, and test understanding not memorization.`
          },
          {
            role: 'user',
            content: `Create a 1-minute active recall drill for this concept: "${concept}"

Learning content covered:
${JSON.stringify(learningContent, null, 2)}

Generate EXACTLY 3 questions that:
1. Test core understanding (no hints)
2. Require recall from memory
3. Can be answered in 20-30 seconds each
4. Cover different aspects of the concept

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "Direct question without hints",
      "expectedAnswer": "Key points the student should recall",
      "difficulty": "easy|medium|hard"
    }
  ],
  "timeLimit": 60
}`
          }
        ],
        max_completion_tokens: 800
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recall drill generation error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse recall drill response');
      }
    }

    console.log('Generated', parsed.questions?.length || 0, 'recall questions');

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Recall drill generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
