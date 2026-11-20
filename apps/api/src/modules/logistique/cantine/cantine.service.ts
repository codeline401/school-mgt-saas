import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../lib/prisma.js";
import {
  CreerOffreCantineInput,
  ModifierOffreCantineInput,
  OffresCantineQuery,
} from "./cantine.schema.js";

type UserContext = {
  id: string;
  role: string;
  schoolId: string | null;
};

export class CantineError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message); //
    this.name = "CantineError"; // Set the error name explicitly
  }
}

function requireSchool(user: UserContext): string {
  if (!user.schoolId) {
    throw new CantineError(
      "Vous devez appartenir à une école pour gérer la cantine",
      403,
    );
  }
  return user.schoolId; // Return the school ID if it exists
}

async function trouverOffreCantine(offreId: string, schoolId: string) {
  const offre = await prisma.offreCantine.findFirst({
    where: { id: offreId, schoolId },
  });

  if (!offre) {
    throw new CantineError("Offre de cantine introuvable", 404);
  }
  return offre; // Return the found offer if it exists
}

export class CantineService {
  /**
   * List cantine offers for the user's school based on the provided query parameters
   * @param query The query parameters for filtering cantine offers
   * @param user The user context containing ID, role, and school ID
   * @returns A list of cantine offers matching the query and user's school
   */
  static async lister(query: OffresCantineQuery, user: UserContext) {
    const schoolId = requireSchool(user); // Ensure the user belongs to a school and get the school ID

    const where: Prisma.OffreCantineWhereInput = {
      schoolId,
      ...(query.anneeScolaire ? { anneeScolaire: query.anneeScolaire } : {}),
      ...(query.actif !== undefined ? { actif: query.actif === "true" } : {}),
    };
    return prisma.offreCantine.findMany({
      where,
      orderBy: [{ anneeScolaire: "desc" }, { nom: "asc" }],
    }); // Return the list of offers matching the query
  }

  /**
   * Create a new cantine offer for the user's school
   * @param input The input data for creating a cantine offer
   * @param user The user context containing ID, role, and school ID
   * @returns The newly created cantine offer
   */
  static async creer(input: CreerOffreCantineInput, user: UserContext) {
    const schoolId = requireSchool(user); // Ensure the user belongs to a school and get the school ID

    return prisma.offreCantine.create({
      data: {
        ...input,
        schoolId, // Associate the offer with the user's school ID
      },
    });
  }

  /**
   * Update a cantine offer for the user's school
   * @param offreId The ID of the cantine offer to modify
   * @param input The input data for modifying the cantine offer
   * @param user The user context containing ID, role, and school ID
   * @returns The updated cantine offer
   */
  static async modifier(
    offreId: string,
    input: ModifierOffreCantineInput,
    user: UserContext,
  ) {
    const schoolId = requireSchool(user); // Ensure the user belongs to a school and get the school ID
    await trouverOffreCantine(offreId, schoolId); // Ensure the offer exists and belongs to the user's school

    return prisma.offreCantine.update({
      where: { id: offreId, schoolId },
      data: input,
    });
  }

  /**
   * Deactivate a cantine offer for the user's school
   * @param offreId The ID of the cantine offer to deactivate
   * @param user The user context containing ID, role, and school ID
   * @returns The updated cantine offer with actif set to false
   */
  static async desactiver(offreId: string, user: UserContext) {
    const schoolId = requireSchool(user); // Ensure the user belongs to a school and get the school ID
    await trouverOffreCantine(offreId, schoolId); // Ensure the offer exists and belongs to the user's school

    return prisma.offreCantine.update({
      where: { id: offreId, schoolId },
      data: { actif: false },
    });
  }
}
