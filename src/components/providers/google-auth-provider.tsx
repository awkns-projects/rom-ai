'use client'

import type { PropsWithChildren } from "react";

import React, { useState, createContext } from 'react';
import Script from "next/script";

export const GoogleAuthContext = createContext<any>("google-auth");

export const GoogleAuthProvider = (props:PropsWithChildren)=>{
  const { children } = props;

  const [userInfo, setUserInfo] = useState<Record<string, any>>({});
  const [gsiClient, setGsiClient] = useState<Record<string, any>>({});

  const userLogin = () => {
    if (gsiClient.requestAccessToken) {
      gsiClient.requestAccessToken();
    }
  };

  const userLogout = () => {
    setUserInfo({});
    localStorage.removeItem("google_auth_type");
    localStorage.removeItem("google_auth_token");
  };

  const gsiInit = () => {
    const gsi = (window as any).google;
    if (gsi) {
      const client = gsi.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL,
        res_type: "token",
        scope: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_SCOPE,
        include_granted_scopes: "true",
        state: "RomAI",
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            localStorage.setItem("google_auth_type", tokenResponse.token_type);
            localStorage.setItem("google_auth_token", tokenResponse.access_token);

            if (
              gsi.accounts.oauth2.hasGrantedAnyScope(
                tokenResponse,
                "https://www.googleapis.com/auth/userinfo.profile"
              )
            ) {
              gsiLogin(userLogin);
            }
          }
        },
      });

      setGsiClient(client);
    }
  };

  const gsiLogin = async (callback: (gsiData: Record<string, any>) => void) => {
    const auth_type = localStorage.getItem("google_auth_type");
    const auth_token = localStorage.getItem("google_auth_token");
    if (auth_type && auth_token) {
      await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          method: "GET",
          headers: {
            Authorization: `${auth_type} ${auth_token}`,
            "Content-Type": `application/json`,
          },
        })
        .then(response => response.json())
        .then((res:any) => {
          const gsiData = res;

          setUserInfo({
            ...userInfo,
            ...gsiData,
            token_type: auth_type,
            access_token: auth_token,
          });
        })
        .catch((error) => {
          if (error.status === 401) {
            userLogout();
          }
        })
    }
  };

  return (
    <GoogleAuthContext.Provider value={{
        userInfo,
        setUserInfo,
        userLogin,
        userLogout,
      }}>
      <Script
        src="https://accounts.google.com/gsi/client"
        async
        defer
        onLoad={() => {
          gsiInit();
        }}
      ></Script>
      { children }
    </GoogleAuthContext.Provider>
  )
}