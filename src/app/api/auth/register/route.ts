import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    // GraphQL mutation for creating a user
    const mutation = `
  mutation MyMutation2($email: citext!, $passwordHash: String!) {
  insertUser(object: { locale: "en", email: $email, passwordHash: $passwordHash }) {
    id
  }
}

  `;
    const response = await fetch(
      "https://local.hasura.local.nhost.run/v1/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "nhost-admin-secret",
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            email,
            passwordHash: hashedPassword,
          },
        }),
      }
    );
    const result = await response.json();
    console.log(result);
    if (response.ok && result.data?.insertUser) {
      return NextResponse.json(
        { message: "User signed up successfully!" },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: result.errors?.[0]?.message || "Failed to sign up." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in user registration:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
