import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CustomProvider from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";
export const options: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ID as string,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_SECRET as string,
    }),
    {
      id: "nhost",
      name: "nhost",
      type: "oauth",
      authorization: `${process.env.NEXT_PUBLIC_NHOST_AUTH_URL}/v1/signin/google`,
      // callback:`${process.env.NEXT_PUBLIC_NHOST_AUTH_URL}/v1/signin/google/callback`,
      token: `${process.env.NEXT_PUBLIC_NHOST_AUTH_URL}/v1/token`,
      userinfo: `${process.env.NEXT_PUBLIC_NHOST_AUTH_URL}/v1/user`,
      profile(profile) {
        return {
          id: profile.id,
          // name: profile.kakao_account?.profile.nickname,
          // email: profile.kakao_account?.email,
          // image: profile.kakao_account?.profile.profile_image_url,
        };
      },
    },
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your Email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          console.error("Missing credentials");
          return null;
        }
        try {
          // Send GraphQL query to fetch user by email
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: `
                query GetUserByEmail($email: citext!) {
                  user: users(where: { email: { _eq: $email } }) {
                    id
    displayName
    email
    passwordHash
    defaultRole
    phoneNumber
    }
}`,
                variables: {
                  email: credentials?.email,
                },
              }),
            }
          );

          console.log(credentials?.email);
          const { data, errors } = await response.json();
          // Handle GraphQL errors
          if (errors) {
            console.error("GraphQL errors:", errors);
            return null;
          }

          const user = data?.user?.[0];

          // If no user is found, return null
          if (!user) {
            return null;
          }
          // Compare the provided password with the hashed password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (isValidPassword) {
            // Return the user object to NextAuth
            return {
              id: user.id,
              name: user.displayName,
              email: user.email,
              defaultRole: user.defaultRole,
              phoneNumber: user.phoneNumber,
              accessToken: data.accessToken,
            };
          } else {
            // Invalid password
            return null;
          }
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    newUser: "/",
    signIn: "/auth/signin", // Redirect new users to a welcome page
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // If user is defined, include the accessToken
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      // Add accessToken to the session
      session.accessToken = token.accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL starts with the base URL, keep the redirect
      if (url.startsWith(baseUrl)) {
        return url; // Stay within the same domain
      }

      // Default redirect for all other cases
      return "/venues"; // Redirect users to the home page
    },
  },
};
