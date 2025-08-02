import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import FacebookProvider from 'next-auth/providers/facebook';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

// Validate required environment variables
const requiredEnvVars = {
  AUTH_SECRET: process.env.AUTH_SECRET,
  POSTGRES_URL: process.env.POSTGRES_URL,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables for authentication:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('📝 Please set these environment variables:');
  console.error('   - AUTH_SECRET: A secret key for JWT signing');
  console.error('   - POSTGRES_URL: PostgreSQL connection string');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
}

// Validate NEXTAUTH_URL for production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
  console.warn('⚠️ NEXTAUTH_URL not set in production. This may cause redirect issues.');
  console.warn('   Set NEXTAUTH_URL to your production domain (e.g., https://your-domain.com)');
}

console.log('🔐 Auth configuration loaded successfully:', {
  environment: process.env.NODE_ENV,
  hasAuthSecret: !!process.env.AUTH_SECRET,
  hasDatabase: !!process.env.POSTGRES_URL,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL || 'not_set',
  hasNgrok: !!process.env.NGROK_URL,
});

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

// Custom GitHub provider
const GitHubProvider = {
  id: 'github-oauth',
  name: 'GitHub',
  type: 'oauth' as const,
  authorization: {
    url: 'https://github.com/login/oauth/authorize',
    params: {
      scope: 'read:user user:email repo'
    }
  },
  token: 'https://github.com/login/oauth/access_token',
  userinfo: 'https://api.github.com/user',
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
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
  userinfo: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.id,
      name: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
      email: null, // LinkedIn email requires separate API call
      image: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
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
      name: profile.name,
      email: profile.person?.email,
      image: profile.avatar_url,
      type: 'regular' as UserType
    };
  }
};

// Determine environment settings
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  
  // Simplified session and JWT configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Environment-appropriate cookie settings
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? undefined : undefined, // Let browser handle domain
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? undefined : undefined,
      },
    },
    csrfToken: {
      name: isProduction ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? undefined : undefined,
      },
    },
  },
  
  providers: [
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize({ email, password }: any) {
        if (!email || !password) return null;
        
        try {
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
        } catch (error) {
          console.error('❌ Credentials auth failed:', error);
          return null;
        }
      },
    }),
    Credentials({
      id: 'guest',
      name: 'guest',
      credentials: {},
      async authorize() {
        try {
          console.log('🎭 Creating guest user...');
          const [guestUser] = await createGuestUser();
          console.log('✅ Guest user created:', guestUser.email);
          return { ...guestUser, type: 'guest' };
        } catch (error) {
          console.error('❌ Guest auth failed:', error);
          throw error;
        }
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,publish_to_groups',
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url,
          type: 'regular' as UserType,
        };
      },
    }),
    GoogleProvider,
    GitHubProvider,
    LinkedInProvider,
    NotionProvider,
    InstagramProvider,
    ShopifyProvider,
    ThreadsProvider
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🔑 JWT callback:', { hasUser: !!user, hasAccount: !!account, tokenId: token.id });
      
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        console.log('💾 Stored user in token:', { id: token.id, type: token.type });
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
        
        console.log('🔗 Stored OAuth account:', account.provider);
      }

      return token;
    },
    
    async session({ session, token }) {
      console.log('🎫 Session callback:', { hasSession: !!session.user, tokenId: token.id });
      
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.type = token.type;
        console.log('✅ Session updated:', { id: session.user.id, type: session.user.type });
      }

      return session;
    },
    
    async signIn({ user, account, profile }) {
      console.log('🚪 SignIn callback:', { 
        userId: user?.id, 
        userType: user?.type,
        provider: account?.provider,
        accountType: account?.type 
      });
      
      // Handle OAuth sign-ins
      if (account?.type === 'oauth') {
        console.log('🔗 OAuth sign-in approved for:', account.provider);
        return true;
      }
      
      console.log('✅ Credentials sign-in approved');
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('↪️ Redirect callback:', { url, baseUrl });
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      
      return baseUrl;
    }
  },
  
  events: {
    async signIn(message) {
      console.log('📝 SignIn event:', { 
        user: message.user?.email, 
        account: message.account?.provider,
        isNewUser: message.isNewUser 
      });
    },
    async signOut() {
      console.log('📝 SignOut event triggered');
    },
    async session(message) {
      console.log('📝 Session event:', { user: message.session?.user?.email });
    },
  },
  
  debug: isDevelopment,
});
