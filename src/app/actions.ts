"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Delete a task from the database.
 */
export async function deleteTask(id: string) {
  try {
    await prisma.universalTask.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Sentinel Action] Deletion failed:", error);
    throw new Error("ARCHIVE_OPERATION_FAILED");
  }
}

/**
 * Server Action: Toggle global Study Mode state.
 */
export async function toggleStudyMode() {
  const current = await prisma.globalSettings.findUnique({ where: { id: "singleton" } });
  const newState = !current?.studyModeActive;

  await prisma.globalSettings.upsert({
    where: { id: "singleton" },
    update: { studyModeActive: newState },
    create: { id: "singleton", studyModeActive: newState },
  });

  revalidatePath("/");
}

/**
 * Server Action: Fetch WhatsApp connection state for UI polling.
 */
export async function getWhatsAppState() {
  const state = await prisma.systemState.findUnique({ where: { id: "global" } });
  return {
    qr: state?.whatsappQr || null,
    connected: state?.whatsappConnected || false,
    updatedAt: state?.updatedAt?.toISOString() || null,
  };
}
