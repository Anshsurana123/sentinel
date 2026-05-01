"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Action to delete a task from the database.
 */
export async function deleteTask(id: string) {
  try {
    await prisma.universalTask.delete({
      where: { id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Sentinel Action] Deletion failed:", error);
    throw new Error("ARCHIVE_OPERATION_FAILED");
  }
}

/**
 * Server Action to toggle the global Study Mode state.
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
