import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }

  interface Account {
    provider: string;
    providerAccountId: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    accounts?: Array<{
      provider: string;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }>;
  }
}

// Custom Instagram provider (using OAuth2)
const InstagramProvider = {
  id: 'instagram',
  name: 'Instagram',
  type: 'oauth' as const,
  authorization: {
    url: 'https://api.instagram.com/oauth/authorize',
    params: {
      scope: 'user_profile,user_media',
      response_type: 'code'
    }
  },
  token: 'https://api.instagram.com/oauth/access_token',
  userinfo: 'https://graph.instagram.com/me?fields=id,username',
  clientId: process.env.INSTAGRAM_CLIENT_ID,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.username,
      email: null, // Instagram doesn't provide email by default
      image: null,
      username: profile.username,
      type: 'regular' as UserType
    };
  }
};

// Custom Shopify provider
const ShopifyProvider = {
  id: 'shopify',
  name: 'Shopify',
  type: 'oauth' as const,
  authorization: {
    url: 'https://{{shop}}.myshopify.com/admin/oauth/authorize',
    params: {
      scope: 'read_products,write_products,read_orders,write_orders',
      response_type: 'code'
    }
  },
  token: 'https://{{shop}}.myshopify.com/admin/oauth/access_token',
  userinfo: 'https://{{shop}}.myshopify.com/admin/api/2023-10/shop.json',
  clientId: process.env.SHOPIFY_CLIENT_ID,
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.shop?.id?.toString() || '',
      name: profile.shop?.name || '',
      email: profile.shop?.email || '',
      image: null,
      shopDomain: profile.shop?.domain,
      type: 'regular' as UserType
    };
  }
};

// Custom Threads provider (Meta's Threads uses similar OAuth to Instagram)
const ThreadsProvider = {
  id: 'threads',
  name: 'Threads',
  type: 'oauth' as const,
  authorization: {
    url: 'https://threads.net/oauth/authorize',
    params: {
      scope: 'threads_basic,threads_content_publish',
      response_type: 'code'
    }
  },
  token: 'https://graph.threads.net/oauth/access_token',
  userinfo: 'https://graph.threads.net/v1.0/me?fields=id,username',
  clientId: process.env.THREADS_CLIENT_ID,
  clientSecret: process.env.THREADS_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.username,
      email: null,
      image: null,
      username: profile.username,
      type: 'regular' as UserType
    };
  }
};

// Custom Google provider
const GoogleProvider = {
  id: 'google',
  name: 'Google',
  type: 'oauth' as const,
  authorization: {
    url: 'https://accounts.google.com/o/oauth2/auth',
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    }
  },
  token: 'https://oauth2.googleapis.com/token',
  userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      type: 'regular' as UserType
    };
  }
};

// Custom GitHub OAuth provider (separate from NextAuth's built-in GitHub)
const GitHubOAuthProvider = {
  id: 'github-oauth',
  name: 'GitHub OAuth',
  type: 'oauth' as const,
  authorization: {
    url: 'https://github.com/login/oauth/authorize',
    params: {
      scope: 'user:email repo read:org',
      response_type: 'code'
    }
  },
  token: 'https://github.com/login/oauth/access_token',
  userinfo: 'https://api.github.com/user',
  clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
  clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id.toString(),
      name: profile.name || profile.login,
      email: profile.email,
      image: profile.avatar_url,
      username: profile.login,
      type: 'regular' as UserType
    };
  }
};

// Custom LinkedIn provider
const LinkedInProvider = {
  id: 'linkedin',
  name: 'LinkedIn',
  type: 'oauth' as const,
  authorization: {
    url: 'https://www.linkedin.com/oauth/v2/authorization',
    params: {
      scope: 'r_liteprofile r_emailaddress w_member_social',
      response_type: 'code'
    }
  },
  token: 'https://www.linkedin.com/oauth/v2/accessToken',
  userinfo: 'https://api.linkedin.com/v2/people/~',
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  profile(profile: any) {
    const firstName = profile.localizedFirstName || '';
    const lastName = profile.localizedLastName || '';
    return {
      id: profile.id,
      name: `${firstName} ${lastName}`.trim(),
      email: profile.emailAddress || `${profile.id}@linkedin.local`,
      image: profile.profilePicture?.displayImage || null,
      type: 'regular' as UserType
    };
  }
};

// Custom Notion provider
const NotionProvider = {
  id: 'notion',
  name: 'Notion',
  type: 'oauth' as const,
  authorization: {
    url: 'https://api.notion.com/v1/oauth/authorize',
    params: {
      scope: 'read_content write_content',
      response_type: 'code'
    }
  },
  token: 'https://api.notion.com/v1/oauth/token',
  userinfo: 'https://api.notion.com/v1/users/me',
  clientId: process.env.NOTION_CLIENT_ID,
  clientSecret: process.env.NOTION_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name || 'Notion User',
      email: profile.person?.email || `${profile.id}@notion.local`,
      image: profile.avatar_url,
      type: 'regular' as UserType
    };
  }
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: process.env.NGROK_URL ? {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none', // Changed to 'none' for cross-origin
        path: '/',
        secure: true, // ngrok provides HTTPS
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'none', // Changed to 'none' for cross-origin
        path: '/',
        secure: true, // ngrok provides HTTPS
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none', // Changed to 'none' for cross-origin
        path: '/',
        secure: true, // ngrok provides HTTPS
      },
    },
  } : {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // localhost uses HTTP
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false, // localhost uses HTTP
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // localhost uses HTTP
      },
    },
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'public_profile,pages_read_engagement'
        }
      }
    }),
    GoogleProvider,
    GitHubOAuthProvider,
    LinkedInProvider,
    NotionProvider,
    InstagramProvider,
    ShopifyProvider,
    ThreadsProvider
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      // Store account information for OAuth providers
      if (account) {
        if (!token.accounts) {
          token.accounts = [];
        }
        
        token.accounts.push({
          provider: account.provider,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.type === 'oauth') {
        // Here you could save OAuth tokens to your database
        // For now, we'll allow all OAuth sign-ins
        return true;
      }
      
      return true;
    }
  },
});
