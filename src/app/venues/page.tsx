"use client";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function Bookings() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState("Lucknow, Uttar Pradesh");
  const [venues, setVenues] = useState([]);
  const handleToggle = () => {
    setIsSearching((prev) => !prev);
  };

  const scrollToVenues = () => {
    const venueSection = document.getElementById("venues-section");
    if (venueSection) {
      venueSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  const getVenues = async () => {
    const response = await fetch(
      "https://local.hasura.local.nhost.run/v1/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "nhost-admin-secret",
        },
        body: JSON.stringify({
          query: `
            query {
              venues {
                amenities
                close_at
                open_at
                sports
                title
                id
                images
                location
                map
                description
                user_id
                rating
              }
            }
          `,
        }),
      }
    );
    console.log(response);
    const { data, errors } = await response.json();
    console.log(data?.venues);
    setVenues(data?.venues);
  };

  const sportIcons = {
    Football: " ⚽ ",
    Basketball: " 🏀 ",
    Cricket: " 🏏 ",
    Badminton: " 🏸 ",
    Tennis: " 🎾 ",
  };

  useEffect(() => {
    getVenues();
  }, []);

  return (
    <>
      <Navbar />
      <SidebarInset>
        <header className="flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-black-600">
            PlayNue - Now in Lucknow, Uttar Pradesh
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Box: Welcome Message */}
            <div className="rounded-xl bg-green-600 p-6 text-white shadow-md">
              <h2 className="text-2xl font-semibold">
                Welcome to PlayNue in Lucknow!
              </h2>
              <p className="mt-4 text-sm">
                We are excited to launch our platform in the vibrant city of
                Lucknow. Explore top-rated sports venues and make your bookings
                with ease. Enjoy a hassle-free experience at the best locations!
              </p>
              <button
                onClick={scrollToVenues}
                className="mt-4 bg-white text-green-600 py-2 px-4 rounded-lg shadow-md hover:bg-gray-100"
              >
                Explore Venues Below
              </button>
            </div>

            {/* Second Box: City Info & Map */}
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img
                src="https://encrypted-tbn2.gstatic.com/licensed-image?q=tbn:ANd9GcSH-hY03lKzhlwt78INPqQrftsrQ_dnR6U5YAZx3N8U4xGT7RrLgidyXPIdqtgTD4l56k_u1AmPvwD9m6OUoc67lhz8N1CPnVwk3FdRWA"
                alt="Lucknow City"
                className="w-full h-64 object-fit"
              />
              <div className="p-4 bg-gray-800 text-white">
                <h2 className="text-xl font-semibold">
                  Discover Sports in Lucknow
                </h2>
                <p className="mt-2 text-sm">
                  Find the best sports venues in Lucknow, from cricket turfs to
                  badminton courts. We offer you a wide range of choices to
                  match your enthusiasm and energy.
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[250vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div
              style={{ padding: "30px" }}
              className="grid auto-rows-min gap-20 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            >
              {venues?.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden p-4 text-black shadow-lg transition-transform duration-300 ${
                    hoveredItem === item?.id ? "scale-105" : "scale-100"
                  }`}
                  onMouseEnter={() => setHoveredItem(item?.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <img
                    src={item?.images}
                    alt={`${item.name}'s image`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex flex-col justify-end">
                    <p className="text-white text-lg font-bold">{item.title}</p>
                    <p className="text-white text-sm">
                      Rating: {item.rating} ⭐
                    </p>
                    <div className="text-white text-xl flex gap-2">
                      {item.sports?.map((sport: string) => (
                        <span key={sport}>{sportIcons[sport] || "❓"}</span>
                      ))}
                    </div>
                    {hoveredItem === item.id && (
                      <Link href={`/venue-details/${item.id}`}>
                        <button className="mt-2 bg-green-500 text-white w-full py-1 rounded-lg shadow-md">
                          Book Now
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}

// 1cff347d-6685-4b9d-9940-f64f646bd683
