import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { code } = data;

  const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '';
  const apiSecret = process.env.NEXT_PUBLIC_INSTAGRAM_APP_SECRET || '';
  const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';
  // const fields = process.env.NEXT_PUBLIC_INSTAGRAM_FIELDS || '';

  let access_token = '';
  let user_id = '';
  let userInfo = {};

  let isAuthenticationError = false;

  if( code ) {
    const params = new URLSearchParams();
    params.append('client_id', appId);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('redirect_uri', 'rom.cards.noel.ngrok.app');
    params.append('grant_type', 'authorization_code');
    params.append('code', code);

    // Instagram's bug to always get:
    // {
    //   error_type: 'OAuthException',
    //   code: 400,
    //   error_message: 'Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request'
    // }
    await fetch(`https://api.instagram.com/oauth/access_token`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params
    }).then((response)=>{
      return response.json();
    }).then((res: any)=>{
      console.log('resresresresres',res);
      if(typeof res.error === 'undefined') {
        access_token = res.access_token;
        user_id = res.user_id;
      } else {
        isAuthenticationError = true;
      }
    }).catch((error)=>{
      console.log('errorerrorerrorerrorerror',error);
      isAuthenticationError = true;
    })

    // if(!isAuthenticationError) {
    //   const params = new URLSearchParams();
    //   params.append('access_token', access_token);
    //   params.append('fields', fields);

    //   await fetch(`https://graph.threads.net/v1.0/me?${params}`, {
    //     method: "GET",
    //     headers: {
    //       'Content-Type': 'application/json',
    //     }
    //   }).then((response) => {
    //     return response.json()
    //   })
    //   .then((res:any) => {
    //     userInfo = res;
    //   }).catch(()=>{
    //     isAuthenticationError = true;
    //   })
    // }

    if(!isAuthenticationError) {
      return NextResponse.json({
        access_token,
        user_id,
        ...userInfo
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to login instagram.' },
        { status: 401 }
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Failed to login instagram.' },
      { status: 401 }
    );
  }
}