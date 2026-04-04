import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, recipient, budget, description, flowerNames } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const flowerList = flowerNames && flowerNames.length > 0
      ? flowerNames.join(", ")
      : "assorted seasonal flowers";

    const moodStyles: Record<string, string> = {
      romantic: "soft pink and red tones, roses, peonies, intimate and elegant",
      joyful: "bright and vibrant colors, sunflowers, daisies, cheerful and lively",
      calm: "pastel and muted tones, lavender, eucalyptus, serene and peaceful",
      grateful: "warm golden and orange tones, chrysanthemums, autumn colors, heartfelt",
      sympathetic: "white and soft purple tones, lilies, gentle and comforting",
      celebratory: "luxurious and bold colors, mixed flowers, festive and grand",
    };

    const style = moodStyles[mood] || "elegant and beautiful";

    const prompt = `Generate a stunning, photorealistic image of a beautifully arranged flower bouquet. 
Style: ${style}
Flowers to include: ${flowerList}
Occasion: A ${mood} bouquet for a ${recipient}
Budget feel: ${budget > 500000 ? "premium and luxurious" : "elegant yet accessible"}
${description ? `Special notes: ${description}` : ""}

The bouquet should be:
- Professionally wrapped in elegant paper (kraft or tissue paper)
- Shot from a 3/4 angle with soft, natural lighting
- On a clean, minimal background (marble or light surface)
- With visible texture and depth
- Magazine-quality flower photography style
- No text or watermarks`;

    // Call Gemini imagen API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini API error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      throw new Error("No image was generated");
    }

    const imageUrl = `data:image/png;base64,${base64Image}`;

    // Upload to Supabase storage
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const imageBytes = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
    const fileName = `bouquet-${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("bouquets")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Fallback: return base64 directly
      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage.from("bouquets").getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});