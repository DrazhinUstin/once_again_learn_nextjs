import { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ request, auth }) {
      const isSignIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isSignIn) return true;
        return false;
      }
      if (isSignIn)
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
