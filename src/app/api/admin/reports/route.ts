import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { reportId, action, targetType, targetId } = body;

  if (!reportId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  if (action === "dismiss") {
    await serviceClient
      .from("reports")
      .update({ status: "reviewed" })
      .eq("id", reportId);

    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing target" }, { status: 400 });
    }

    if (targetType === "spot") {
      await serviceClient.from("spots").delete().eq("id", targetId);
    } else if (targetType === "rating") {
      await serviceClient.from("ratings").delete().eq("id", targetId);
    }

    await serviceClient
      .from("reports")
      .update({ status: "actioned" })
      .eq("id", reportId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
