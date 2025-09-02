"use client";
// pages/tournaments.js
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "../components/Navbar";

export default function Tournaments() {
  // Sample tournament data - replace with your API data
  const allTournaments = [
    {
      id: 1,
      name: "Cricket Tournament",
      sport: "Cricket",
      area: "B-1/130 SECTOR-G ALIGANJ LUCKNOW NEAR COLD-STORAGE (GULAB VATIKA",
      entryFee: 2000,
      startDate: "2025-01-25",
      venue: "Playturf",
      teamsRegistered: 8,
      maxTeams: 16,
      status: "closed",
      image: "/playturfT.jpg",
    },
    {
      id: 2,
      name: "Football Tournament",
      sport: "Football",
      area: "Plot no.700 amar shaheed path near eldeco express plaza road, eldeco udyaan-2 south city Lucknow 22605",
      entryFee: 1500,
      startDate: "2025-03-22",
      venue: "Player's Town-South City",
      teamsRegistered: 5,
      maxTeams: 16,
      status: "closed",
      image: "/footballtournament2.jpg",
    },
    {
      id: 3,
      name: "Lucknow Box Cricket League (LBCL)",
      sport: "Box Cricket",
      area: "Jankipuram, Lucknow 22605",
      entryFee: 3499,
      startDate: "2025-04-19",
      venue:
        "Athletes Sports Arena 38, Engineering College Rd, Sector B, Jankipuram, Lucknow, Uttar Pradesh 226021",
      teamsRegistered: 10,
      maxTeams: 16,
      status: "closed",
      image: "/lbcl1.jpg",
    },
    {
      id: 4,
      name: "PlayTurf Cricket Tournament",
      sport: "Cricket",
      area: "Sector-G, Aliganj, Lucknow",
      entryFee: 2000,
      startDate: "2025-04-26",
      venue:
        "B-1/130 Sector-G, Aliganj, Lucknow Near Cold-Storage (Gulab Watika)",
      teamsRegistered: 0,
      maxTeams: null,
      status: "closed",
      image: "/tournament4.jpg",
      prize: {
        winner: 10000,
        runnerUp: 3000,
        manOfTournament: 1100,
      },
      format: "6-A-SIDE TEAM + 1 IMPACT PLAYER",
      contactInfo: ["+91-9235392351", "+91-7017958799"],
      endDate: "2025-04-27",
    },
    {
      id: 5,
      name: "Junior Awadh Football League (U-19)",
      sport: "Football",
      area: "Awadh, Lucknow",
      entryFee: 2699,
      startDate: "2025-06-14",
      venue: "NEXT GEN sports arena , Atheletes sports arena",
      teamsRegistered: 10,
      maxTeams: null,
      status: "closed",
      image: "/afao.jpg",
      prizes: {
        first: "₹13,333 + Trophy + Medals",
        runnerUp: "₹5,555 + Trophy + Medals",
        third: "Trophy + Medals",
      },
      format: "5-A-SIDE + 3 ROLLING SUBS",
      contactInfo: ["7081786006", "7007194398"],
      endDate: "2025-06-15",
    },
    {
      id: 6,
      name: "PlayNue Mini Tournament",
      sport: "Cricket",
      area: "Playturf, Aliganj",
      entryFee: 1600,
      startDate: "2025-10-06",
      venue: "Playturf, Aliganj",
      teamsRegistered: 0,
      maxTeams: null,
      status: "open",
      image: "/pmt.jpg",
      prizes: {
        first: "₹4,000",
        runnerUp: "₹1,600",
      },
      format: "Mini Cricket Tournament",
      contactInfo: ["+91 90444 05954"],
      website: "www.playnue.com",
      endDate: "2025-10-06",
      tagline: "TURF. CRICKET. GLORY. GRAB YOUR TEAM & OWN THE PITCH!",
      description: "BIG REWARDS, BIGGER ACTION!",
    },
  ];

  // State for filters
  const [filters, setFilters] = useState({
    sport: "All Sports",
    area: "All Areas",
    entryFee: "Entry Fee",
  });

  // State for filtered tournaments
  const [filteredTournaments, setFilteredTournaments] =
    useState(allTournaments);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = allTournaments;

    if (filters.sport !== "All Sports") {
      filtered = filtered.filter(
        (tournament) => tournament.sport === filters.sport
      );
    }

    if (filters.area !== "All Areas") {
      filtered = filtered.filter(
        (tournament) => tournament.area === filters.area
      );
    }

    if (filters.entryFee !== "Entry Fee") {
      filtered = filtered.filter((tournament) => {
        switch (filters.entryFee) {
          case "Free":
            return tournament.entryFee === 0;
          case "Under ₹1000":
            return tournament.entryFee < 1000;
          case "₹1000 - ₹5000":
            return tournament.entryFee >= 1000 && tournament.entryFee <= 5000;
          default:
            return true;
        }
      });
    }

    setFilteredTournaments(filtered);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case "open":
        return { text: "Registrations Open", class: "bg-green-500" };
      case "last_call":
        return { text: "Last 2 Days=", class: "bg-yellow-500" };
      case "closed":
        return { text: "Registration Closed", class: "bg-red-500" };
      case "Comming soon":
        return { text: "Coming soon", class: "bg-blue-500" };
      default:
        return { text: "Unknown", class: "bg-gray-500" };
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative h-64 bg-gradient-to-r from-black to-black">
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">Tournaments</h1>
              <p className="text-xl">
                Discover and join exciting tournaments in your city
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
            <select
              name="sport"
              value={filters.sport}
              onChange={handleFilterChange}
              className="px-4 py-2 border rounded-md"
            >
              <option>All Sports</option>
              <option>Cricket</option>
              <option>Pool</option>
            </select>

            <button
              onClick={applyFilters}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-black"
            >
              Filter
            </button>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative h-48">
                  <Image
                    src={tournament.image}
                    alt={tournament.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <div
                    className={`absolute top-4 right-4 ${
                      getStatusBadge(tournament.status).class
                    } text-white px-3 py-1 rounded-full`}
                  >
                    {getStatusBadge(tournament.status).text}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">
                    {tournament.name}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Starts:{" "}
                      {new Date(tournament.startDate).toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{tournament.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {tournament.id === 1 ? (
                      <span>
                        Entry Fee:{" "}
                        <span className="line-through">
                          ₹{tournament.entryFee}
                        </span>{" "}
                        <span className="text-blue-600">₹1950</span>
                      </span>
                    ) : (
                      <span>Entry Fee: ₹{tournament.entryFee}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {tournament.teamsRegistered} teams registered
                    </span>
                    <Link href={`/tournament/${tournament.id}`}>
                      <button
                        disabled={tournament.status === "closed"}
                        className={`${
                          tournament.status === "closed"
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-white px-4 py-2 rounded`}
                      >
                        {tournament.status === "closed"
                          ? "Closed"
                          : "View Details"}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div className="flex justify-center mt-8">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700">
              Load More Tournaments
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
