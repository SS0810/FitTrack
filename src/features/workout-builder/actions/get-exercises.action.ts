"use server";

import { ExerciseAttributeNameEnum } from "@prisma/client";

import { prisma } from "@/shared/lib/prisma";
import { actionClient } from "@/shared/api/safe-actions";

import { getExercisesSchema } from "../schema/get-exercises.schema";

// Utility function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const getExercisesAction = actionClient.schema(getExercisesSchema).action(async ({ parsedInput }) => {
  const { equipment, muscles, limit } = parsedInput;

  // ✅ DEBUG LOGGING ADDED HERE
  console.log("🔍 Frontend sent to filtering function:", { equipment, muscles, limit });
  console.log("🔍 Equipment values:", equipment.map(eq => `"${eq}"`).join(", "));
  console.log("🔍 Muscle values:", muscles.map(muscle => `"${muscle}"`).join(", "));
  console.log("🔍 Limit:", limit);

  try {
    // First, get the attribute name IDs once
    const [primaryMuscleAttributeName, secondaryMuscleAttributeName, equipmentAttributeName] = await Promise.all([
      prisma.exerciseAttributeName.findUnique({
        where: { name: ExerciseAttributeNameEnum.PRIMARY_MUSCLE },
      }),
      prisma.exerciseAttributeName.findUnique({
        where: { name: ExerciseAttributeNameEnum.SECONDARY_MUSCLE },
      }),
      prisma.exerciseAttributeName.findUnique({
        where: { name: ExerciseAttributeNameEnum.EQUIPMENT },
      }),
    ]);

    if (!primaryMuscleAttributeName || !secondaryMuscleAttributeName || !equipmentAttributeName) {
      console.log("❌ Missing attribute names in database");
      throw new Error("Missing attributes in database");
    }

    console.log("✅ Found attribute names:", {
      primary: primaryMuscleAttributeName.name,
      secondary: secondaryMuscleAttributeName.name,
      equipment: equipmentAttributeName.name
    });

    // Get exercises for each selected muscle using Hybrid Algorithm
    const exercisesByMuscle = await Promise.all(
      muscles.map(async (muscle) => {
        console.log(`🔍 Processing muscle: "${muscle}"`);
        
        const MINIMUM_THRESHOLD = 20;
        const TARGET_POOL_SIZE = Math.max(limit * 4, 30); // Larger pool for better randomization

        // Step 1: Get exercises where muscle is PRIMARY
        const primaryExercises = await prisma.exercise.findMany({
          where: {
            AND: [
              {
                attributes: {
                  some: {
                    attributeNameId: primaryMuscleAttributeName.id,
                    attributeValue: {
                      value: muscle,
                    },
                  },
                },
              },
              {
                attributes: {
                  some: {
                    attributeNameId: equipmentAttributeName.id,
                    attributeValue: {
                      value: {
                        in: equipment,
                      },
                    },
                  },
                },
              },
              // Exclude stretching exercises
              {
                NOT: {
                  attributes: {
                    some: {
                      attributeValue: {
                        value: "STRETCHING",
                      },
                    },
                  },
                },
              },
            ],
          },
          include: {
            attributes: {
              include: {
                attributeName: true,
                attributeValue: true,
              },
            },
          },
          take: TARGET_POOL_SIZE,
        });

        console.log(`🔍 Found ${primaryExercises.length} PRIMARY exercises for muscle "${muscle}"`);
        if (primaryExercises.length > 0) {
          console.log(`🔍 Primary exercise names: ${primaryExercises.map(ex => ex.name).join(", ")}`);
        }

        let allExercises = [...primaryExercises];

        // Step 2: If we don't have enough exercises, add SECONDARY muscle exercises
        if (allExercises.length < MINIMUM_THRESHOLD) {
          console.log(`🔍 Need more exercises (${allExercises.length} < ${MINIMUM_THRESHOLD}), searching secondary muscles...`);
          
          const secondaryExercises = await prisma.exercise.findMany({
            where: {
              AND: [
                {
                  attributes: {
                    some: {
                      attributeNameId: secondaryMuscleAttributeName.id,
                      attributeValue: {
                        value: muscle,
                      },
                    },
                  },
                },
                {
                  attributes: {
                    some: {
                      attributeNameId: equipmentAttributeName.id,
                      attributeValue: {
                        value: {
                          in: equipment,
                        },
                      },
                    },
                  },
                },
                // Exclude exercises already found as primary
                {
                  id: {
                    notIn: primaryExercises.map((ex) => ex.id),
                  },
                },
                // Exclude stretching exercises
                {
                  NOT: {
                    attributes: {
                      some: {
                        attributeValue: {
                          value: "STRETCHING",
                        },
                      },
                    },
                  },
                },
              ],
            },
            include: {
              attributes: {
                include: {
                  attributeName: true,
                  attributeValue: true,
                },
              },
            },
            take: TARGET_POOL_SIZE - primaryExercises.length,
          });

          console.log(`🔍 Found ${secondaryExercises.length} SECONDARY exercises for muscle "${muscle}"`);
          allExercises = [...allExercises, ...secondaryExercises];
        }

        console.log(`🔍 Total exercises found for "${muscle}": ${allExercises.length}`);

        // Step 3: Weighted randomization (favor primary muscle exercises)
        const shuffledPrimary = shuffleArray(primaryExercises);
        const shuffledSecondary = shuffleArray(allExercises.filter((ex) => !primaryExercises.some((primary) => primary.id === ex.id)));

        // Step 4: Create final selection with weighted distribution
        const selectedExercises = [];
        const primaryRatio = 0.7; // 70% primary muscles when possible
        const targetPrimary = Math.ceil(limit * primaryRatio);
        const targetSecondary = limit - targetPrimary;

        // Add primary muscle exercises first
        selectedExercises.push(...shuffledPrimary.slice(0, Math.min(targetPrimary, shuffledPrimary.length)));

        // Fill remaining slots with secondary or more primary exercises
        const remainingSlots = limit - selectedExercises.length;
        if (remainingSlots > 0) {
          if (shuffledSecondary.length > 0) {
            selectedExercises.push(...shuffledSecondary.slice(0, Math.min(targetSecondary, shuffledSecondary.length)));
          }

          // If still need more exercises, add more primary ones
          const stillNeedMore = limit - selectedExercises.length;
          if (stillNeedMore > 0 && shuffledPrimary.length > targetPrimary) {
            selectedExercises.push(...shuffledPrimary.slice(targetPrimary, targetPrimary + stillNeedMore));
          }
        }

        // Final shuffle to avoid predictable patterns
        const finalExercises = shuffleArray(selectedExercises).slice(0, limit);

        console.log(`🔍 Final selection for "${muscle}": ${finalExercises.length} exercises`);
        if (finalExercises.length > 0) {
          console.log(`🔍 Selected: ${finalExercises.map(ex => ex.name).join(", ")}`);
        }

        return {
          muscle,
          exercises: finalExercises,
        };
      }),
    );

    // Filter muscles that have no exercises
    const filteredResults = exercisesByMuscle.filter((group) => group.exercises.length > 0);
    
    console.log("🔍 Final Results Summary:");
    console.log(`🔍 Total muscle groups with exercises: ${filteredResults.length}`);
    filteredResults.forEach(group => {
      console.log(`  - ${group.muscle}: ${group.exercises.length} exercises`);
    });

    return filteredResults;
  } catch (error) {
    console.error("❌ Error fetching exercises:", error);
    throw new Error("Error fetching exercises");
  }
});
