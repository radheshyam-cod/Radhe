import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Get user's weak topics and mastery data
    const { data: weakSpots } = await supabase
      .from('weak_spots')
      .select('*, topics(name)')
      .eq('user_id', userId)
      .order('severity', { ascending: false });

    const { data: mastery } = await supabase
      .from('mastery_tracking')
      .select('*, topics(name)')
      .eq('user_id', userId)
      .order('mastery_score', { ascending: true });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL');

    if (!AI_API_KEY || !AI_GATEWAY_URL) {
      throw new Error('AI configuration is not set');
    }

    const timetablePrompt = `Create an optimal weekly study timetable for a ${profile?.class_year || 'student'} at ${profile?.school || 'school'}.

Weak Topics (need more time):
${weakSpots?.slice(0, 5).map(w => `- ${w.topics?.name} (${w.severity} priority)`).join('\n') || 'None'}

Topics by Mastery (lowest first):
${mastery?.slice(0, 5).map(m => `- ${m.topics?.name}: ${m.mastery_score}% mastery`).join('\n') || 'None'}

Requirements:
- Monday-Friday schedule
- Mix of study sessions, revision, and practice
- Prioritize weak topics
- Include breaks and optimal study times (morning/evening)
- Consider retention and spaced repetition

Return ONLY valid JSON array:
[
  {
    "day_of_week": 1-5 (1=Monday),
    "time_slot": "HH:MM-HH:MM",
    "activity": "specific activity description",
    "duration": minutes,
    "topic_id": "optional topic UUID if specific to a topic"
  }
]

Create 3-4 time slots per day.`;

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
            content: 'You are an expert educational scheduler. Create optimal study timetables based on learning science principles. Always return valid JSON.' 
          },
          { role: 'user', content: timetablePrompt }
        ],
      }),
    });

    const aiData = await response.json();
    let schedule;
    
    try {
      const content = aiData.choices[0].message.content;
      schedule = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI timetable, using fallback');
      schedule = [];
      for (let day = 1; day <= 5; day++) {
        schedule.push({ 
          day_of_week: day, 
          time_slot: '09:00-10:00', 
          activity: 'Morning Study Session', 
          duration: 60 
        });
        schedule.push({ 
          day_of_week: day, 
          time_slot: '16:00-17:00', 
          activity: 'Evening Revision', 
          duration: 60 
        });
      }
    }

    // Add user_id to all entries
    const fullSchedule = schedule.map((slot: any) => ({
      ...slot,
      user_id: userId
    }));

    await supabase.from('timetable').delete().eq('user_id', userId);
    await supabase.from('timetable').insert(fullSchedule);

    console.log('Timetable generated successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true, schedule: fullSchedule }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error generating timetable:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
