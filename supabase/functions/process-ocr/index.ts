import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { fileUrl, fileName } = await req.json();
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_GATEWAY_URL = Deno.env.get('AI_GATEWAY_URL');

    if (!AI_API_KEY || !AI_GATEWAY_URL) {
      throw new Error('AI configuration is not set');
    }

    console.log('Processing OCR for file:', fileName);

    const isPDF = fileName.toLowerCase().endsWith('.pdf');
    let extractedContent;

    if (isPDF) {
      // For PDFs: Use text extraction approach with Gemini
      console.log('Processing PDF file');
      
      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `This is a PDF document URL: ${fileUrl}

Extract all text content from this PDF. Then identify the main topics and subtopics from the content. Return ONLY valid JSON in this format:
{
  "text": "extracted text here",
  "topics": [
    {
      "name": "Main Topic Name",
      "subject": "Subject Category (e.g., Physics, Math, Biology)",
      "subtopics": ["subtopic 1", "subtopic 2", "subtopic 3"]
    }
  ]
}

Be thorough in extracting all text, including formulas and key concepts.`
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF processing error:', errorText);
        throw new Error(`AI API error for PDF: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      extractedContent = data.choices[0].message.content;
    } else {
      // For images: Use vision model
      console.log('Processing image file');
      
      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text from this image. Then identify the main topics and subtopics. Return ONLY valid JSON in this format:
{
  "text": "extracted text here",
  "topics": [
    {
      "name": "Main Topic Name",
      "subject": "Subject Category (e.g., Physics, Math, Biology)",
      "subtopics": ["subtopic 1", "subtopic 2", "subtopic 3"]
    }
  ]
}

Be thorough in extracting all text, including handwritten notes, formulas, and diagrams.`
              },
              {
                type: 'image_url',
                image_url: { url: fileUrl }
              }
            ]
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image OCR error:', errorText);
        throw new Error(`AI API error for image: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      extractedContent = data.choices[0].message.content;
    }
    
    console.log('OCR response received');

    // Parse JSON from response
    let parsed;
    try {
      parsed = JSON.parse(extractedContent);
    } catch (e) {
      // If not valid JSON, try to extract JSON from markdown code blocks
      const jsonMatch = extractedContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    console.log('Topics identified:', parsed.topics?.length || 0);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('OCR processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
