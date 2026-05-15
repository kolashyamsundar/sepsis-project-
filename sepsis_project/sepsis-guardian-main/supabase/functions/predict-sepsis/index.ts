import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ml_payload, patient_id } = await req.json();

    if (!ml_payload) {
      return new Response(JSON.stringify({ error: "Missing ml_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ML API URL from secrets
    const mlApiUrl = Deno.env.get("ML_API_URL");
    if (!mlApiUrl) {
      return new Response(
        JSON.stringify({ error: "ML API URL not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call external FastAPI ML model
    // Avoid double /predict if ML_API_URL already ends with it
    const endpoint = mlApiUrl.endsWith("/predict") ? mlApiUrl : `${mlApiUrl.replace(/\/+$/, "")}/predict`;
    console.log("Calling ML endpoint:", endpoint);
    const mlResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(ml_payload),
    });

    if (!mlResponse.ok) {
      const errText = await mlResponse.text();
      console.error("ML API error:", mlResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: "ML model prediction failed",
          details: errText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mlResult = await mlResponse.json();

    // Save prediction to database if patient_id provided
    if (patient_id) {
      const userId = claimsData.claims.sub;

      // Map risk level for DB storage
      let dbRiskLevel = "low";
      const prob = mlResult.sepsis_probability || 0;
      if (prob >= 60) dbRiskLevel = "critical";
      else if (prob >= 40) dbRiskLevel = "medium";

      await supabase.from("predictions").insert({
        patient_id,
        predicted_by: userId,
        mortality_probability: prob,
        risk_level: dbRiskLevel,
        sepsis_stage: mlResult.risk_level || null,
        confidence: null,
      });

      // Notify for high risk
      if (prob >= 40) {
        // Get patient's user_id for notification
        const { data: patient } = await supabase
          .from("patients")
          .select("user_id, patient_name")
          .eq("id", patient_id)
          .single();

        if (patient) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: `${prob >= 60 ? "HIGH" : "MODERATE"} Sepsis Risk Alert`,
            message: `Patient ${patient.patient_name} has ${prob.toFixed(1)}% sepsis probability`,
            type: prob >= 60 ? "emergency" : "warning",
            patient_id,
          });
        }
      }
    }

    return new Response(JSON.stringify(mlResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-sepsis:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
