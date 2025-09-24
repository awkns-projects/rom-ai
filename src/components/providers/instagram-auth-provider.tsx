'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';

export const InstagramAuthContext = createContext<any>("instagram-auth");

// TODO: cause their has bug from instagram, now it is unusable.
export const InstagramAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const fetchUserInfo = async () => {}

  const userLogin = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';
    const scope = process.env.NEXT_PUBLIC_INSTAGRAM_SCOPE || '';

    const state = crypto.randomBytes(16).toString('hex');
    localStorage.setItem("instagram_auth_state", state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: appId,
      redirect_uri: redirectUri,
      scope,
      state,
    });
    
    localStorage.setItem("login_type", "instagram");

    window.location.href = `https://api.instagram.com/oauth/authorize?${params}`;
  }

  const userLogout = () => {
      setUserInfo({});
    localStorage.removeItem("instagram_auth_state");
    // localStorage.removeItem("facebook_auth_code");
    localStorage.removeItem("instagram_auth_user_info");
  }

  useEffect(()=>{
    if(searchParams.size > 0) {
      const loginType = localStorage.getItem("login_type");

      const state = searchParams.get('state');

      if(loginType === 'instagram' && state === localStorage.getItem("instagram_auth_state")) {
        // if(!searchParams.get('error') ) {
        //   localStorage.setItem("instagram_auth_state", searchParams.get('state') || '');
        //   localStorage.setItem("instagram_auth_code", searchParams.get('code') || '');
        // }
        // router.push(`?`);
      }
    }
  }, [searchParams])

  useEffect(()=>{
    const loginType = localStorage.getItem("login_type");

    if(loginType === 'instagram') {
      fetchUserInfo();
    }
  }, [router])

  useEffect(()=>{
    const instagram_auth_user_info = localStorage.getItem("instagram_auth_user_info");

    if(instagram_auth_user_info) {
      setUserInfo(JSON.parse(instagram_auth_user_info))
    }
  }, [])
  
  return (
    <InstagramAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      { children }
    </InstagramAuthContext.Provider>
  )
}