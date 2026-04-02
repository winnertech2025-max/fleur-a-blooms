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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a detailed prompt for bouquet generation
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    // Upload base64 image to Supabase storage
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract base64 data
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    
    const fileName = `bouquet-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("bouquets")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return base64 directly as fallback
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
