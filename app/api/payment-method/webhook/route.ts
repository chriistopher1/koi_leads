// import { createAdminClient } from "@/lib/supabase/admin";
// import { NextRequest, NextResponse } from "next/server";
// import { verifyWebhookToken } from "@/lib/xendit";

// export async function POST(request: NextRequest) {
//   try {
//     // ✅ 1. Verify Xendit callback token
//     const callbackToken = request.headers.get("x-callback-token");

//     if (!callbackToken || !verifyWebhookToken(callbackToken)) {
//       console.error("❌ Invalid webhook token");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // ✅ 2. Parse body AFTER verification
//     const body = await request.json();
//     const data = body.data;

//     const userId = data.reference_id.split("_")[2]; // Assuming reference_id is in the format "pm_link_{userId}_{timestamp}", adjust if needed
//     const paymentMethodId = data.payment_token_id;
//     const customerId = data.customer_id;

//     console.log("✅ Webhook verified");
//     // console.log("body:", body);
//     console.log("userId:", userId);
//     console.log("paymentMethodId:", paymentMethodId);
//     console.log("customerId:", customerId);

//     if (!userId || !paymentMethodId) {
//       console.warn("⚠️ Missing required data");
//       return NextResponse.json({ success: true });
//     }

//     // ✅ 3. Update DB
//     const supabase = await createAdminClient();

//     const { error } = await supabase
//       .from("profiles")
//       .update({
//         payment_method_id: paymentMethodId,
//         xendit_customer_id: customerId,
//       })
//       .eq("id", userId);

//     if (error) {
//       console.error("❌ Supabase error:", error);
//       return NextResponse.json(
//         { error: "Database update failed" },
//         { status: 500 },
//       );
//     }

//     console.log("✅ Payment method saved:", paymentMethodId);

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error("❌ Webhook error:", err);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookToken } from "@/lib/xendit";

export async function POST(request: NextRequest) {
  try {
    // ✅ 1. Verify Xendit callback token
    const callbackToken = request.headers.get("x-callback-token");

    if (!callbackToken || !verifyWebhookToken(callbackToken)) {
      console.error("❌ Invalid webhook token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ 2. Parse body AFTER verification
    const body = await request.json();
    const data = body.data;

    // const userId = data.reference_id.split("_")[2]; // Assuming reference_id is in the format "pm_link_{userId}_{timestamp}", adjust if needed
    // const paymentMethodId = data.payment_token_id;
    // const customerId = data.customer_id;

    console.log("✅ Webhook verified");
    console.log("body:", body);
    // console.log("userId:", userId);
    // console.log("paymentMethodId:", paymentMethodId);
    // console.log("customerId:", customerId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
