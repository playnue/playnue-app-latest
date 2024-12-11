'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Client = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/home.html');
  }, [router]);

  return null; // Render nothing since the user is being redirected
};

export default Client;
