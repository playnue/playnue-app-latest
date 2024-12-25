import { SignupForm } from "@/components/signupform"
import Navbar from "../components/Navbar"

export default function Page() {
  return (
    <>
    <Navbar/>
    <div className="flex h-screen w-full items-center justify-center px-4">
      <SignupForm />
    </div>
    </>
  )
}
