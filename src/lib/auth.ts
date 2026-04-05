import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at
                    ? account.expires_at * 1000
                    : Date.now() + 3600 * 1000;
            }

            const expiresAt = (token.expiresAt as number) || 0;
            if (Date.now() < expiresAt - 5 * 60 * 1000) {
                return token;
            }

            // Token expired or about to expire — try refresh
            if (token.refreshToken) {
                try {
                    const response = await fetch("https://oauth2.googleapis.com/token", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            client_id: process.env.GOOGLE_CLIENT_ID as string,
                            client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                            grant_type: "refresh_token",
                            refresh_token: token.refreshToken as string,
                        }),
                    });

                    const refreshed = await response.json();

                    if (!response.ok) {
                        throw new Error(refreshed.error || "Refresh failed");
                    }

                    token.accessToken = refreshed.access_token;
                    token.expiresAt = Date.now() + refreshed.expires_in * 1000;

                    if (refreshed.refresh_token) {
                        token.refreshToken = refreshed.refresh_token;
                    }
                } catch (error) {
                    console.error("Error refreshing access token:", error);
                    token.error = "RefreshAccessTokenError";
                }
            }

            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.error = token.error as string | undefined;
            return session;
        },
    },
};
