import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { comparePassword } from "@/lib/auth/password";
import { googleOAuthConfig } from "@/config/googleOAuth";

export const authOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user || !user.password) throw new Error("Invalid email or password");
        if (user.isSuspended) throw new Error("This account has been suspended");

        const valid = await comparePassword(credentials.password, user.password);
        if (!valid) throw new Error("Invalid email or password");

        user.lastLoginAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionTier: user.subscriptionTier
        };
      }
    }),
    GoogleProvider({
      clientId: googleOAuthConfig.clientId,
      clientSecret: googleOAuthConfig.clientSecret
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await connectDB();
        let existing = await User.findOne({ email: user.email });
        if (!existing) {
          existing = await User.create({
            name: user.name,
            username: user.email.split("@")[0] + "_" + Date.now().toString().slice(-4),
            email: user.email,
            authProvider: "google",
            googleId: account.providerAccountId,
            role: "user",
            subscriptionTier: "free",
            isVerified: true
          });
        }
        if (existing.isSuspended) return false;
        user.id = existing._id.toString();
        user.role = existing.role;
        user.subscriptionTier = existing.subscriptionTier;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionTier = user.subscriptionTier;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.subscriptionTier = token.subscriptionTier;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
