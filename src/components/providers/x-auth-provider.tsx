'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';

export const XAuthContext = createContext<any>("x-auth");

export const XAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
 
  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const fetchUserInfo = async () => {
    const x_auth_code = localStorage.getItem("x_auth_code");
    const x_auth_code_verifier = localStorage.getItem("x_auth_code_verifier");

    if(x_auth_code && x_auth_code_verifier) {
      await fetch('./api/auth/x/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: x_auth_code,
          code_verifier: x_auth_code_verifier
        })
      })
      .then((response) => {
        return response.json()
      })
      .then((res:any) => {
        localStorage.setItem("x_auth_access_token", res.access_token);
        localStorage.setItem("x_auth_refresh_token", res.refresh_token);

        setUserInfo({
          ...userInfo,
          ...res
        });

        localStorage.setItem("x_auth_user_info", JSON.stringify({
          ...userInfo,
          ...res
        }));
      })
      .catch((error) => {
        if (error.status === 401) {
          userLogout();
        }
      }).finally(()=>{
        localStorage.removeItem("login_type");
      })
    }
  }

  const userLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_X_REDIRECT_URI || '';
    
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    localStorage.setItem("x_auth_code_verifier", codeVerifier);
    const sha256Verifier = crypto.createHash('sha256').update(codeVerifier).digest('base64');
    const codeChallenge = sha256Verifier.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const scope = process.env.NEXT_PUBLIC_X_SCOPE || '';

    const state = crypto.randomBytes(16).toString('hex');
    localStorage.setItem("x_auth_state", state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    localStorage.setItem("login_type", "x");

    window.location.href = `https://x.com/i/oauth2/authorize?${params}`;
  }
  
  const userLogout = () => {
    setUserInfo({});
    localStorage.removeItem("x_auth_state");
    localStorage.removeItem("x_auth_code");
    localStorage.removeItem("x_auth_code_verifier");
    localStorage.removeItem("x_auth_access_token");
    localStorage.removeItem("x_auth_refresh_token");
    localStorage.removeItem("x_auth_user_info");
    localStorage.removeItem("x_auth_user_info");
  }

  useEffect(()=>{
    if(searchParams.size > 0) {
      const loginType = localStorage.getItem("login_type");

      const state = searchParams.get('state');

      if(loginType === 'x' && state === localStorage.getItem("x_auth_state")) {
        localStorage.setItem("x_auth_state", searchParams.get('state') || '');
        localStorage.setItem("x_auth_code", searchParams.get('code') || '');
        router.push(`?`);
      }
    }
  }, [searchParams])

  useEffect(()=>{
    const loginType = localStorage.getItem("login_type");

    if(loginType === 'x') {
      fetchUserInfo();
    }
  }, [router])

  useEffect(()=>{
    const x_auth_user_info = localStorage.getItem("x_auth_user_info");

    if(x_auth_user_info) {
      setUserInfo(JSON.parse(x_auth_user_info))
    }
  }, [])
  
  return (
    <XAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      { children }
    </XAuthContext.Provider>
  )
}