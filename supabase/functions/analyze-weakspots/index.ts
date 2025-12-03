import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topicId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Get all attempts with question details
    const { data: attempts } = await supabase
      .from('attempts')
      .select('*, questions(*)')
      .eq('questions.topic_id', topicId);
    
    const { data: topic } = await supabase
      .from('topics')
      .select('name, user_id')
      .eq('id', topicId)
      .single();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!attempts || attempts.length === 0) {
      return new Response(
        JSON.stringify({ 
          masteryScore: 0, 
          weakSpots: [{ concept: 'Not enough data', severity: 'high' }] 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate basic metrics
    const correct = attempts.filter(a => a.is_correct).length;
    const total = attempts.length;
    const avgTime = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0) / total;
    const avgConfidence = attempts.reduce((sum, a) => sum + (a.confidence || 3), 0) / total;

    // Use AI gateway for intelligent weak spot analysis
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL');

    if (!AI_API_KEY || !AI_GATEWAY_URL) {
      throw new Error('AI configuration is not set');
    }
    
    const analysisPrompt = `Analyze these test results for topic "${topic.name}":

Total Questions: ${total}
Correct: ${correct}
Accuracy: ${Math.round((correct/total)*100)}%
Average Time: ${avgTime}s
Average Confidence: ${avgConfidence}/5

Attempt Details:
${attempts.map((a, i) => `Q${i+1}: ${a.is_correct ? '✓' : '✗'} | Time: ${a.time_taken}s | Confidence: ${a.confidence}/5 | Question: ${a.questions?.question_text?.substring(0, 100)}`).join('\n')}

Based on this data, identify 3-5 specific weak spots (concepts) with severity (high/medium/low). Return ONLY valid JSON in this exact format:
{
  "masteryScore": number (0-100),
  "weakSpots": [
    {"concept": "specific concept name", "severity": "high/medium/low", "reason": "why this is weak"}
  ],
  "gaps": ["prerequisite concept 1", "prerequisite concept 2"]
}`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${AI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an educational data analyst. Analyze test performance and identify precise learning gaps. Always return valid JSON.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    const aiData = await response.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    console.log('AI Analysis:', analysis);

    // Store weak spots in database
    await supabase.from('weak_spots').delete().eq('topic_id', topicId);
    
    if (analysis.weakSpots && analysis.weakSpots.length > 0) {
      await supabase.from('weak_spots').insert(
        analysis.weakSpots.map((w: any) => ({ 
          concept: w.concept, 
          severity: w.severity,
          user_id: topic?.user_id, 
          topic_id: topicId 
        }))
      );
    }

    // Update mastery tracking
    await supabase.from('mastery_tracking').upsert({ 
      user_id: topic?.user_id, 
      topic_id: topicId, 
      mastery_score: analysis.masteryScore,
      accuracy: Math.round((correct/total)*100),
      avg_time: Math.round(avgTime),
      last_practiced: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        masteryScore: analysis.masteryScore, 
        weakSpots: analysis.weakSpots,
        gaps: analysis.gaps || []
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error analyzing weak spots:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
