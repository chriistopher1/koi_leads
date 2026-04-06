import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json(); // Optional, for context

  try {
    // Create Xendit Payment Session for SAVE (session_type: "SAVE")
    const response = await fetch("https://api.xendit.co/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.XENDIT_API_KEY}:`,
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        reference_id: `pm_link_${user.id}_${Date.now()}`,
        session_type: "SAVE",
        amount: 0,
        currency: "IDR",
        country: "ID",
        customer: {
          reference_id: user.id,
          type: "INDIVIDUAL",
          email: user.email,
          individual_detail: {
            given_names: user.email,
          },
        },
        mode: "COMPONENTS",
        components_configuration: {
          origins: ["https://unsympathisingly-braw-dulcie.ngrok-free.dev"],
        },
        success_return_url: `https://unsympathisingly-braw-dulcie.ngrok-free.dev/payment-method/success`,
        cancel_return_url: `https://unsympathisingly-braw-dulcie.ngrok-free.dev/payment-method/failed`,

        // Or "COMPONENTS" if using SDK
        // Add expires_at if needed: new Date(Date.now() + 15*60*1000).toISOString()
      }),
    });

    // console.log("Create Payment Session response status:", response.status);

    const session = await response.json();
    console.log("Create Payment Session response:", session);
    if (!response.ok)
      throw new Error(session.error?.message || "Failed to create session");

    return NextResponse.json({
      session_id: session.payment_session_id,
      redirect_url: session.payment_link_url, // Use Linking UI redirect
    });
  } catch (error) {
    console.log("Error creating payment session:", error);
    return NextResponse.json(
      { error: "Failed to link payment method" },
      { status: 500 },
    );
  }
}

// New: Webhook to save payment_method_id after linking (call from Xendit webhook endpoint)
// export async function POST_webhook(request: NextRequest) {
//   // Separate route or handle in main POST with verification
//   // Verify Xendit signature with process.env.XENDIT_CALLBACK_TOKEN
//   const body = await request.json();
//   const userId = body.metadata?.user_id; // Pass user.id in metadata when creating session
//   const paymentMethodId = body.payment_method?.id;

//   if (userId && paymentMethodId) {
//     const supabase = await createClient();
//     await supabase
//       .from("profiles")
//       .update({ payment_method_id: paymentMethodId })
//       .eq("id", userId);
//   }

//   return NextResponse.json({ success: true });
// }
