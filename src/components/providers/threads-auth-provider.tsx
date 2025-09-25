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

    const fetchUserInfo = async () => {
    const threads_auth_code = localStorage.getItem("threads_auth_code");

    if(threads_auth_code) {
      await fetch('./api/auth/threads/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: threads_auth_code
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

        console.log('fetchUserInfo',res)
        
        setUserInfo(newUserInfo)

        localStorage.setItem("threads_auth_user_info", JSON.stringify(newUserInfo));
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

    window.location.href = `https://threads.net/oauth/authorize?${params}`;
  }

  const userLogout = () => {
    setUserInfo({});
    localStorage.removeItem("threads_auth_code");
    localStorage.removeItem("threads_auth_state");
    localStorage.removeItem("threads_auth_user_info");
  }

  useEffect(()=>{
    if(searchParams.size > 0) {
      const loginType = localStorage.getItem("login_type");

      const state = searchParams.get('state');

      if(loginType === 'threads' && state === localStorage.getItem("threads_auth_state")) {
        if(!searchParams.get('error') ) {
          localStorage.setItem("threads_auth_state", searchParams.get('state') || '');
          localStorage.setItem("threads_auth_code", searchParams.get('code') || '');
        }
        router.push(`?`);
      }
    }
  }, [searchParams])
  
  useEffect(()=>{
    const loginType = localStorage.getItem("login_type");

    if(loginType === 'threads') {
      fetchUserInfo();
    }
  }, [router])

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