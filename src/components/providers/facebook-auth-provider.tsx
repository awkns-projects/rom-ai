'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext, useEffect } from 'react';
import Script from "next/script";
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';

export const FacebookAuthContext = createContext<any>("facebook-auth");

export const FacebookAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const fetchUserInfo = async () => {
    const facebook_auth_code = localStorage.getItem("facebook_auth_code");

    if(facebook_auth_code) {
      await fetch('./api/auth/facebook/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: facebook_auth_code
        })
      })
      .then((response) => {
        return response.json()
      })
      .then((res:any) => {
        const newUserInfo = {
          ...userInfo,
          ...res
        }
        
        setUserInfo(newUserInfo)

        localStorage.setItem("facebook_auth_user_info", JSON.stringify(newUserInfo));
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
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI || '';

    const state = crypto.randomBytes(16).toString('hex');
    localStorage.setItem("facebook_auth_state", state);

    const params = new URLSearchParams({
      response_type: 'code',
      auth_type: 'rerequest',
      client_id: appId,
      redirect_uri: redirectUri,
      state,
    });
    
    localStorage.setItem("login_type", "facebook");

    window.location.href = `https://www.facebook.com/v23.0/dialog/oauth?${params}`;
  }

  const userLogout = () => {
    setUserInfo({});
    localStorage.removeItem("facebook_auth_state");
    localStorage.removeItem("facebook_auth_code");
    localStorage.removeItem("facebook_auth_user_info");
  }

  useEffect(()=>{
    if(searchParams.size > 0) {
      const loginType = localStorage.getItem("login_type");

      const state = searchParams.get('state');

      if(loginType === 'facebook' && state === localStorage.getItem("facebook_auth_state")) {
        if(!searchParams.get('error') ) {
          localStorage.setItem("facebook_auth_state", searchParams.get('state') || '');
          localStorage.setItem("facebook_auth_code", searchParams.get('code') || '');
        }
        router.push(`?`);
      }
    }
  }, [searchParams])

  useEffect(()=>{
    const loginType = localStorage.getItem("login_type");

    if(loginType === 'facebook') {
      fetchUserInfo();
    }
  }, [router])

  useEffect(()=>{
    const facebook_auth_user_info = localStorage.getItem("facebook_auth_user_info");

    if(facebook_auth_user_info) {
      setUserInfo(JSON.parse(facebook_auth_user_info))
    }
  }, [])

  return (
    <FacebookAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      { children }
    </FacebookAuthContext.Provider>
  )
}