import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { weakSpotId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: weakSpot } = await supabase.from('weak_spots').select('*').eq('id', weakSpotId).single();
    
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL');

    if (!AI_API_KEY || !AI_GATEWAY_URL) {
      throw new Error('AI configuration is not set');
    }

    const content: any = {};

    // Use OpenAI GPT-5 for deep, complex learning content
    const formats = [
      { key: 'feynman', prompt: `Explain "${weakSpot.concept}" using the Feynman Technique. Break it down to simple terms as if teaching a beginner. Use analogies and examples.` },
      { key: 'explanation', prompt: `Provide 3 different detailed explanations of "${weakSpot.concept}" - one intuitive, one technical, and one practical with real-world applications.` },
      { key: 'analogy', prompt: `Create 3 powerful analogies to explain "${weakSpot.concept}". Each analogy should relate to everyday experiences and make the concept memorable.` },
      { key: 'example', prompt: `Provide a complete step-by-step solved example demonstrating "${weakSpot.concept}". Include detailed explanations for each step.` }
    ];

    // Use AI gateway for high-quality educational content with enhanced teaching methods
    for (const format of formats) {
      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert educator skilled in multiple teaching methods. You explain concepts using:

1. FEYNMAN METHOD: Explain like teaching a 5-year-old, breaking down complex ideas into simple language with step-by-step reasoning.
2. MULTIPLE EXPLANATIONS: Provide 2-3 different ways to understand the same concept, each using different angles or mental models.
3. ANALOGIES & REAL-WORLD: Connect abstract concepts to everyday objects and experiences students can relate to.
4. SOLVED EXAMPLES: Show complete exam-type problems with step-by-step solutions and explanation of each step.

Your goal is DEEP UNDERSTANDING, not surface memorization. Make concepts crystal clear.` 
            },
            { role: 'user', content: format.prompt }
          ],
          max_completion_tokens: 2500
        }),
      });
      const data = await response.json();
      content[format.key] = data.choices[0].message.content;
    }

    // Generate visual mind map using image generation via the AI gateway
    const imageResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ 
          role: 'user', 
          content: `Create a colorful mind map diagram for the concept "${weakSpot.concept}". Use a central node with 4-6 branches showing key sub-concepts. Educational style, clear labels, modern design.` 
        }],
        modalities: ["image", "text"]
      }),
    });

    const imageData = await imageResponse.json();
    if (imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
      content.mindmap = `<img src="${imageData.choices[0].message.images[0].image_url.url}" alt="Mind map for ${weakSpot.concept}" style="max-width: 100%; border-radius: 8px;" />`;
    } else {
      content.mindmap = `<div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: center;"><h3>${weakSpot.concept}</h3><p>Visual mind map</p></div>`;
    }

    console.log('Learning content generated successfully for:', weakSpot.concept);

    return new Response(JSON.stringify(content), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Error generating learning content:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
