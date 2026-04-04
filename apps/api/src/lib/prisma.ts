import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Exportation d'une instance de Prisma Client pour être utilisée dans toute l'application
const globalForPrisma = global as unknown as { prisma: PrismaClient }; // Type assertion pour ajouter une propriété `prisma` à l'objet global

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL, // URL de connexion à la base de données PostgreSQL, définie dans le fichier .env
});

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter: adapter }); // Si une instance de Prisma Client existe déjà, l'utiliser, sinon en créer une nouvelle

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma; // En développement, stocker l'instance de Prisma Client dans l'objet global pour éviter les problèmes de multiples instances lors du hot-reloading
