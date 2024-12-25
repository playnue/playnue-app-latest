"use client"
import React, { useState } from 'react'
import Client from "../app/client/page"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nhost } from '@/lib/nhost';
const page = () => {
  const router = useRouter();
  const [session, setSession] = useState(null)
  
  useEffect(() => {
    setSession(nhost.auth.getSession())

    nhost.auth.onAuthStateChanged((_, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    router.push('/home.html');
  }, [router]);

  return null;
}

export default page