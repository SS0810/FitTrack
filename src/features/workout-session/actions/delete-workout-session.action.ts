"use server";

import { z } from "zod";

import { prisma } from "@/shared/lib/prisma";
import { actionClient } from "@/shared/api/safe-actions";
import { serverAuth } from "@/entities/user/model/get-server-session-user";

const deleteWorkoutSessionSchema = z.object({
  id: z.string(),
});

export const deleteWorkoutSessionAction = actionClient.schema(deleteWorkoutSessionSchema).action(async ({ parsedInput }) => {
  try {
    const user = await serverAuth();
    const { id } = parsedInput;

    if (!user) {
      console.error("❌ User not authenticated");
      return { serverError: "NOT_AUTHENTICATED" };
    }

    // Vérifier que la session appartient à l'utilisateur
    const session = await prisma.workoutSession.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!session) {
      console.error("❌ Session not found:", id);
      return { serverError: "Session not found" };
    }

    if (session.userId !== user.id) {
      console.error("❌ Unauthorized access to session:", id);
      return { serverError: "Unauthorized" };
    }

    // Supprimer la session (cascade supprimera automatiquement les exercices et sets)
    await prisma.workoutSession.delete({
      where: { id },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("✅ Workout session deleted successfully:", id);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting workout session:", error);
    return { serverError: "Failed to delete workout session" };
  }
});
