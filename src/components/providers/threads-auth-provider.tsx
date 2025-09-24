'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import crypto from 'crypto';

export const ThreadsAuthContext = createContext<any>("threads-auth");

export const ThreadsAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});

  const userLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_THREADS_APP_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI || '';
    const scope = process.env.NEXT_PUBLIC_THREADS_SCOPE || '';

    const state = crypto.randomBytes(16).toString('hex');
    localStorage.setItem("threads_auth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'code',
      state,
    });

    localStorage.setItem("login_type", "threads");

    window.location.href = `https://www.threads.net/oauth?${params}`;
  }

  const userLogout = () => {}

  useEffect(()=>{
    const threads_auth_user_info = localStorage.getItem("threads_auth_user_info");

    if(threads_auth_user_info) {
      setUserInfo(JSON.parse(threads_auth_user_info))
    }
  }, [])

  return (
    <ThreadsAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      { children }
    </ThreadsAuthContext.Provider>
  )
}