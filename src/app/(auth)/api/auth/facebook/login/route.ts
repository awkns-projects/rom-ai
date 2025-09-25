import { NextRequest, NextResponse } from 'next/server';

// TODO: cause their has bug from instagram, now it is unusable.
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { code } = data;

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
  const apiSecret = process.env.NEXT_PUBLIC_FACEBOOK_APP_SECRET || '';
  const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '';
  const fields = process.env.NEXT_PUBLIC_FACEBOOK_FIELDS || '';

  let access_token = '';
  let token_type = '';
  let expires_in = '';
  let userInfo = {};

  let isAuthenticationError = false;

  if( code ) {
    const params = new URLSearchParams();
    params.append('client_id', appId);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('code', code);

    await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?${params}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      }
    }).then((response)=>{
      return response.json();
    }).then((res: any)=>{
      if(typeof res.error === 'undefined') {
        access_token = res.access_token;
        token_type = res.token_type;
        expires_in = res.expires_in;
      } else {
        isAuthenticationError = true;
      }
    }).catch((error)=>{
      isAuthenticationError = true;
    })

    if(!isAuthenticationError) {
      const params = new URLSearchParams();
      params.append('access_token', access_token);
      params.append('fields', fields);

      await fetch(`https://graph.facebook.com/me?${params}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      }).then((response) => {
        return response.json();
      })
      .then((res:any) => {
        userInfo = res;
      }).catch(()=>{
        isAuthenticationError = true;
      })
    }

    if(!isAuthenticationError) {
      return NextResponse.json({
        access_token,
        token_type,
        expires_in,
        ...userInfo
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to login facebook.' },
        { status: 401 }
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Failed to login facebook.' },
      { status: 401 }
    );
  }
}