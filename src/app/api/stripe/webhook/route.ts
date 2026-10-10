import { NextResponse } from "next/server";
import { getStripe, markOrderPaid } from "@/lib/commerce";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  const sig = req.headers.get("stripe-signature") || "";
  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    const orderId = Number(s.metadata?.orderId);
    if (orderId && s.payment_status === "paid") await markOrderPaid(orderId, "stripe", s.id);
  }
  return NextResponse.json({ received: true });
}
