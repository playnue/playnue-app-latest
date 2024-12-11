"use client"; // Mark the component as a client component
import { useState } from "react";
import { useSession } from "next-auth/react"; // Client-side session
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import logo from "../logo.png";
import  Sidebar  from "@/components/nav-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import sidebar from "../sidebar.png"
import right from "../right.png"
export default function Navbar() {
  const { data: session } = useSession(); // Get session data client-side
  const [sidebarVisible, setSidebarVisible] = useState(false); // State for sidebar visibility

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
    console.log(session?.user)
  };

  return (
    <nav className="bg-black p-4 w-full relative overflow-x-hidden">
      <ul className="flex justify-between text-2xl font-bold content-center">
        <li className="flex content-center items-center">
          {session && (
            <button
              onClick={toggleSidebar}
              aria-label="Toggle Sidebar"
              className="focus:outline-none mr-4"
            >
              <Image
            src={right}
            alt="sidebar Logo"
            height={20}
            width={20}
          />
            </button>
          )}
          <Image
            src={logo}
            alt="PlayNue Logo"
            className="h-8"
            height={30}
            width={80}
          />
        </li>
        {!session && (
          <ul className="flex justify-between content-center">
            <li className="rounded-full mr-4">
              <Link href="/api/auth/signin">
                <Button>Login</Button>
              </Link>
            </li>
            <li>
              <Link href="/signup">
                <Button>Signup</Button>
              </Link>
            </li>
          </ul>
        )}
      </ul>

       <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 ${
          sidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "250px", zIndex: 50 }}
      >
        <Sidebar/>
      </div>
      {sidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={toggleSidebar}
          style={{ zIndex: 40 }}
        ></div>
      )}
    </nav>
  );
}

// "use client";
// import { getServerSession } from "next-auth";
// import Link from "next/link";
// import { options } from "../api/auth/[...nextauth]/options";
// import Image from "next/image";
// import img from "../img.png";
// import { Button } from "@/components/ui/button";
// import logo from "../logo.png";
// import { AppSidebar } from "@/components/app-sidebar";
// import { useState } from "react";
// export default async function Navbar() {
//   const session = await getServerSession(options);
//   const [sidebarVisible, setSidebarVisible] = useState(false); // State to manage sidebar visibility

//   // Function to toggle sidebar visibility
//   const toggleSidebar = () => {
//     setSidebarVisible(!sidebarVisible);
//   };
//   return (
//     <nav className="bg-white p-4 w-full box-content">
//       <ul className="flex justify-between  text-2xl font-bold content-center w-full ">
//         <li className="flex content-center items-center">
//           {" "}
//           {session && (
//             <button
//               onClick={toggleSidebar}
//               className="cursor-pointer"
//               aria-label="Toggle Sidebar"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 className="h-6 w-6  @lg/thread:inline-flex cursor-pointer"
//               >
//                 <path
//                   fill-rule="evenodd"
//                   clip-rule="evenodd"
//                   d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z"
//                   fill="currentColor"
//                 ></path>
//               </svg>
//             </button>
//           )}{" "}
//           <Image
//             src={logo}
//             alt="PlayNue Logo"
//             className="h-8"
//             height={30}
//             width={80}
//           />
//         </li>
//         {!session && (
//           <ul className="flex justify-between content-center mr-4">
//             <li className="rounded-full mr-4">
//               <Link href="/api/auth/signin">
//                 <Button>Login</Button>
//               </Link>
//             </li>
//             <li className="">
//               <Link href="/signup">
//                 <Button>Signup</Button>
//               </Link>
//             </li>
//             <li></li>
//           </ul>
//         )}
//         {/* <li><Link href="/api/auth/signin">Sign In</Link></li>
//             <Link href="/api/auth/signout">Sign Out</Link>
//                 <li><Link href="/signup">Sign Up</Link></li>
//                 <li><Link href="/server">Server</Link></li>
//                 <li><Link href="/client">Client</Link></li>
//                 <li><Link href="/extra">Extra</Link></li> */}
//       </ul>
//       {sidebarVisible && <AppSidebar />} {/* Conditionally render AppSidebar */}
//     </nav>
//   );
// }
