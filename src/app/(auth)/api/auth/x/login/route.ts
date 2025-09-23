import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { code, code_verifier } = data;

  const client_id = process.env.NEXT_PUBLIC_X_CLIENT_ID || '';
  const client_secret = process.env.NEXT_PUBLIC_X_CLIENT_SECRET || '';
  const redirect_uri = process.env.NEXT_PUBLIC_X_REDIRECT_URI || '';

  let access_token = '';
  let refresh_token = '';
  let userInfo = {};

  if( code && code_verifier ) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    params.append('code_verifier', code_verifier);

    await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
      },
      body: params
    }).then((response)=>{
      return response.json()
    }).then((res: any)=>{
      access_token = res.access_token;
      refresh_token = res.refresh_token;
    })

    await fetch('https://api.twitter.com/2/users/me', {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      }
    }).then((response) => {
      return response.json()
    })
    .then((res:any) => {
      userInfo = res.data;
    })

    return NextResponse.json({
      access_token,
      refresh_token,
      ...userInfo
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } else {
    return NextResponse.json(
      { error: 'Failed to login x(twitter)' },
      { status: 500 }
    );
  }
}
