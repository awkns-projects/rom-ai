'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';

export const ShopifyAuthContext = createContext<any>("shopify-auth");

export const ShopifyAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const fetchUserInfo = async () => {
    const shopify_auth_code = localStorage.getItem("shopify_auth_code");
    const shopify_auth_shop = localStorage.getItem("shopify_auth_shop");

    if(shopify_auth_code && shopify_auth_shop) {
      await fetch('./api/auth/shopify/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: shopify_auth_code,
          shop: shopify_auth_shop
        })
      })
      .then((response) => {
        return response.json()
      })
      .then((res:any) => {
        setUserInfo({
          ...userInfo,
          ...res
        })

        localStorage.setItem("shopify_auth_user_info", JSON.stringify({
          ...userInfo,
          ...res
        }));
      })
      .catch((error) => {
        if (error.status === 401) {
          userLogout();
        }
      })
      .finally(()=>{
        localStorage.removeItem("login_type");
      })
    }
  }

  const userLogin = () => {
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';
    const redirectUri = process.env.NEXT_PUBLIC_SHOPIFY_REDIRECT_URI || '';
    const scope = process.env.NEXT_PUBLIC_SHOPIFY_SCOPE || ''; 
    const shopName = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME || '';

    const state = crypto.randomBytes(16).toString('hex');
    localStorage.setItem("shopify_auth_state", state);

    const params = new URLSearchParams({
      client_id: apiKey,
      scope,
      redirect_uri: redirectUri,
      state
    });

    localStorage.setItem("login_type", "shopify");

    window.location.href = `https://${shopName}.myshopify.com/admin/oauth/authorize?${params}`;
  }

  const userLogout = () => {
    setUserInfo({});
    localStorage.removeItem("shopify_auth_state");
    localStorage.removeItem("shopify_auth_code");
    localStorage.removeItem("shopify_auth_shop");
  }

  useEffect(()=>{
    if(searchParams.size > 0) {
      const loginType = localStorage.getItem("login_type");

      const state = searchParams.get('state');

      if(loginType === 'shopify' && state === localStorage.getItem("shopify_auth_state")) {
        localStorage.setItem("shopify_auth_code", searchParams.get('code') || '');
        localStorage.setItem("shopify_auth_state", searchParams.get('state') || '');
        localStorage.setItem("shopify_auth_shop", searchParams.get('shop') || '');
        router.push(`?`);
      }
    }
  }, [searchParams])

  useEffect(()=>{
    const loginType = localStorage.getItem("login_type");

    if(loginType === 'shopify') {
      fetchUserInfo();
    }
  }, [router])

  useEffect(()=>{
    const shopify_auth_user_info = localStorage.getItem("shopify_auth_user_info");

    if(shopify_auth_user_info) {
      setUserInfo(JSON.parse(shopify_auth_user_info))
    }
  }, [])

  return (
    <ShopifyAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      { children }
    </ShopifyAuthContext.Provider>
  )
}