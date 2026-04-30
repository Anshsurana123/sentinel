"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Server Action to delete a task from the database.
 * Triggers a revalidation of the home page to reflect changes instantly.
 */
export async function deleteTask(id: string) {
  try {
    await prisma.universalTask.delete({
      where: { id },
    });
    
    // Refresh the home page timeline
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("[Sentinel Action] Failed to delete task:", error);
    throw new Error("ARCHIVE_OPERATION_FAILED");
  }
}
