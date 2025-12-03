import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topicId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    const { data: topic } = await supabase.from('topics').select('*').eq('id', topicId).single();
    
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL');

    if (!AI_API_KEY || !AI_GATEWAY_URL) {
      throw new Error('AI configuration is not set');
    }
    
    console.log('Generating adaptive questions for topic:', topic.name);
    
    // Use AI gateway for fast question generation with Bloom's taxonomy
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ 
          role: 'user', 
          content: `Generate 8-12 adaptive diagnostic questions for the topic: "${topic.name}"
          
Subject: ${topic.subject || 'General'}
Subtopics: ${topic.subtopics?.join(', ') || 'Not specified'}

Design questions using Bloom's Taxonomy levels:
- 2-3 REMEMBER/UNDERSTAND (easy): Basic recall and comprehension
- 3-4 APPLY/ANALYZE (medium): Problem-solving and analysis
- 2-3 EVALUATE/CREATE (hard): Critical thinking and synthesis

Requirements:
1. Test prerequisite concepts progressively
2. Each question should force thinking, not guessing
3. Wrong answers should reveal specific misconceptions
4. Include difficulty curve: easy → medium → critical
5. Cover different aspects of the topic

Return ONLY valid JSON array in this exact format:
[
  {
    "question_text": "Clear, specific question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Exact match from options",
    "difficulty": "easy|medium|hard"
  }
]

Ensure questions are exam-quality and test true understanding.` 
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Question generation error:', errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse questions response');
      }
    }
    
    console.log('Generated', questions.length, 'adaptive questions');
    
    const { data: inserted } = await supabase.from('questions').insert(
      questions.map((q: any) => ({ ...q, user_id: topic.user_id, topic_id: topicId }))
    ).select();

    return new Response(JSON.stringify({ questions: inserted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
