import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { code, shop } = data;

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';
  const apiSecret = process.env.NEXT_PUBLIC_SHOPIFY_API_SECRET || '';
  const shopName = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME || '';

  let access_token = '';
  let scope = '';
  let userInfo = {};

  let isAuthenticationError = false;

  if( shop === `${shopName}.myshopify.com` && code ) {
    await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code
      })
    }).then((response)=>{
      return response.json()
    }).then((res: any)=>{
      if(typeof res.error === 'undefined') {
        access_token = res.access_token;
        scope = res.scope;
      } else {
        isAuthenticationError = true;
      }
    }).catch((error)=>{
      isAuthenticationError = true;
    })

    if(!isAuthenticationError) {
      await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        method: "GET",
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        }
      }).then((response) => {
        return response.json()
      })
      .then((res:any) => {
       if(typeof res.errors === 'undefined') {
          userInfo = res;
        } else {
          isAuthenticationError = true;
        }
      }).catch((error)=>{
        isAuthenticationError = true;
      })
    }

    if(!isAuthenticationError) {
      return NextResponse.json({
        access_token,
        scope,
        ...userInfo
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to login shopify' },
        { status: 401 }
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Failed to login shopify' },
      { status: 401 }
    );
  }
}