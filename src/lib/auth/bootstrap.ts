import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

const INITIAL_ADMIN_EMAIL = "admin@example.com";
const INITIAL_ADMIN_PASSWORD = "admin";

let bootstrapPromise: Promise<void> | null = null;

async function ensureInitialUserExistsInternal() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return;
  }

  try {
    await prisma.user.create({
      data: {
        email: INITIAL_ADMIN_EMAIL,
        passwordHash: hashPassword(INITIAL_ADMIN_PASSWORD),
      },
    });
  } catch (error) {
    // Another request/process may have created the initial user concurrently.
    const knownError = error as { code?: string } | null;
    if (knownError?.code !== "P2002") {
      throw error;
    }
  }
}

export async function ensureInitialUserExists() {
  if (!bootstrapPromise) {
    bootstrapPromise = ensureInitialUserExistsInternal().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}

