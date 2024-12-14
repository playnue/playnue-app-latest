"use client"
import React from 'react'
import Client from "../app/client/page"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
const page = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/home.html');
  }, [router]);

  return null;
}

export default page