import NextAuth, { DefaultSession } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db, users, accounts, sessions, verificationTokens, profiles, userSettings, userStatistics, eq } from "@expp/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
    } & DefaultSession["user"];
  }
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db as any, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = signInSchema.parse(credentials);

          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/auth/welcome",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Auto-create profile for new users
      if (account && user.id) {
        const [existingProfile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);

        if (!existingProfile) {
          // Create profile
          await db.insert(profiles).values({
            id: user.id,
            firstName: profile?.given_name || user.name?.split(" ")[0] || "",
            lastName: profile?.family_name || user.name?.split(" ").slice(1).join(" ") || "",
            avatarUrl: user.image || null,
            preferences: {},
            isAdmin: false,
          });

          // Create user settings
          await db.insert(userSettings).values({
            userId: user.id,
            theme: "light",
            language: "en",
            notificationsEnabled: true,
            preferences: {},
          });

          // Create user statistics
          await db.insert(userStatistics).values({
            userId: user.id,
            solvedTasks: 0,
            totalTaskAttempts: 0,
            solvedSheets: 0,
            totalSheetAttempts: 0,
            successRate: "0",
            averageScore: "0",
            totalTimeSpent: 0,
            tasksByDifficulty: { easy: 0, medium: 0, hard: 0 },
            tasksByTopic: {},
            tasksByType: {},
            recentActivity: 0,
            lastActivityAt: new Date(),
          });
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch profile data
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, user.id))
          .limit(1);

        if (profile) {
          session.user.firstName = profile.firstName;
          session.user.lastName = profile.lastName;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("User created:", user.id);
    },
  },
  debug: process.env.NODE_ENV === "development",
});
