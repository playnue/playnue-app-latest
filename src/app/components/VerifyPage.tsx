"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { nhost } from "@/lib/nhost";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const VerifyPage = () => {
  const router = useRouter();
  const { accessToken } = router.query;

  useEffect(() => {
    const handleVerification = async () => {
      if (accessToken) {
        try {
          // Set session with access token
        //   const result = await nhost.auth.setSession({ accessToken });

          if (result.error) {
            console.error("Error setting session:", result.error);
            toast.error("Verification failed. Please try again.", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } else {
            // Save session to localStorage
            localStorage.setItem("nhost_session", JSON.stringify(result.session));
            toast.success("Verification successful! Logging you in...", {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });

            // Redirect to dashboard or homepage
            setTimeout(() => {
              router.push("/");
            }, 3000);
          }
        } catch (error) {
          console.error("Error during verification:", error);
          toast.error("An unexpected error occurred. Please try again.", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      }
    };

    handleVerification();
  }, [accessToken, router]);

  return (
    <>
      <ToastContainer />
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-lg">Verifying your account...</h1>
      </div>
    </>
  );
};

export default VerifyPage;
