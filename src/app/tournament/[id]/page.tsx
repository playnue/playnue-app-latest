"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccessToken, useAuthenticationStatus, useUserData } from "@nhost/nextjs";
import "../../loader.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/app/components/Navbar";

const TournamentDetails = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const user = useUserData();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const allTournaments = [
    {
      id: 1,
      name: "Cricket Tournament",
      sport: "Cricket",
      area: "B-1/130 SECTOR-G ALIGANJ LUCKNOW NEAR COLD-STORAGE (GULAB VATIKA)",
      entryFee: 2000,
      startDate: "2025-01-25",
      endDate: "2025-01-26",
      venue: "Playturf",
      teamsRegistered: 8,
      players: 11,
      maxTeams: 16,
      priceType: "team",
      status: "open",
      image: "/playturfT.jpg",
      description:
        "Join the most prestigious cricket tournament in Lucknow. Teams from across the city compete for the championship title.",
      instructions: [
        "Participants must be at least 14 years old at the time of registration.",
        "Each team must consist of six and eight players.",
        "Teams are required to provide valid identification for all players (e.g., national ID, driver’s license, or student ID) on request.",
        "Teams must complete the registration form and submit it before 23-January-2025.",
        "The registration fee of Rs. 2000.00 must be paid in full at the time of registration. Failure to do so will result in an incomplete registration",
        "Once the registration is confirmed, the team is committed to participating in the Tournament.",
        "Playturf reserves the right to refuse registration at its discretion if it believes a team does not meet the eligibility requirements.",
        "Any changes to the team roster (player replacements) must be submitted in writing to Playturf for approval before 24-January-2025.",
      ],
      prizes: {
        first: "₹10,000",
        runnerUp: "₹3,000",
        manOfTheTournament: "₹2,000",
      },
      registrationForm: "https://forms.gle/87pRZJ81iMYdF7sj6",
    },
    {
      id: 2,
      name: "Football Tournament",
      sport: "Football",
      area: "Plot no.700 amar shaheed path near eldeco express plaza road, eldeco udyaan-2 south city lucknow 226025",
      entryFee: 1500,
      startDate: "2025-03-22",
      endDate: "2025-03-23",
      venue: "Player's Town- South City",
      teamsRegistered: 5,
      players: 6,
      maxTeams: 16,
      priceType: "team",
      status: "open",
      image: "/footballtournament2.jpg",
      description: "Here's to a fantastic football tournament! May every match be filled with excitement and fair play",
      instructions: [
        "Maximum Participants: 16 teams",
        "Total Players: 6+2 per team",
        "Tournament Governed by House Rules",
        "Registration fee includes refreshments",
        "Pre-registration is mandatory through official website",
        "Teams must arrive on time for their scheduled matches",
        "All players must follow fair play guidelines"
      ],
      prizes: {
        first: "₹7000",
        runnerUp: "₹3000",
        topScorer: "₹1500"
      },
      registrationForm: "https://forms.gle/87pRZJ81iMYdF7sj6"
    },
    {
      id: 3,
      name: "Lucknow Box Cricket League (LBCL)",
      sport: "Box Cricket",
      area: "38, Engineering College Rd, Sector B, Jankipuram, Lucknow, Uttar Pradesh 226021",
      entryFee: 3499,
      startDate: "2025-04-19",
      endDate: "2025-04-20",
      venue: "Athletes Sports Arena ",
      teamsRegistered: 0,
      players: 11,
      maxTeams: 16,
      priceType: "team",
      status: "open",
      image: "/lbcl2.jpg",
      description: "Lucknow awaits its cricketing conqueror: 16 teams, 1 dream, 1 trophy. Experience the thrill of box cricket in Lucknow's premier cricket competition with a prize pool of ₹30,000!",
      instructions: [
        "Format: Box Cricket (6 overs per innings)",
        "Teams: 16 teams maximum (8 players per team - 6 main players + 1 impact player + 1 substitute)",
        "Registration Deadline: April 1, 2025",
        "Teams must wear matching colored jerseys",
        "Tournament will be played according to official box cricket rules",
        "Teams must arrive 30 minutes before scheduled match time",
        "Decisions by umpires and tournament officials are final",
        "Fair play is expected from all participants",
        "No refunds for no-shows or disqualified teams"
      ],
      prizes: {
        first: "₹20,000",
        runnerUp: "₹7,000",
        thirdPlace: "₹3,000",
      },
      additionalRewards: [
        "Trophies for winning teams",
        "Medals for outstanding performers",
        "Certificates for all participants",
        "10% discount vouchers at ASA Sports Store",
        "Tournament merchandise and goodies"
      ],
      tournamentFormat: [
        "Group Stage: 4 groups of 4 teams each",
        "Top 2 teams from each group advance to knockout stage",
        "Quarter-finals, Semi-finals, and Finals"
      ],
      registrationForm: "https://forms.gle/WGbNoE3xV92AyA877"
    }

  ];
  
  // useEffect(() => {
  //   // Check authentication status after initial load
  //   if (!isLoading) {
  //     if (!isAuthenticated) {
  //       // Get the full current URL path and search parameters
  //       const currentPath = window.location.pathname;
  //       const searchParams = window.location.search;
  //       const fullPath = `${currentPath}${searchParams}`;
  //       const returnUrl = encodeURIComponent(fullPath);
        
  //       // Redirect to login with return URL
  //       router.push(`/login?returnUrl=${returnUrl}`);
  //       return;
  //     }

  //     // Only load tournament data if authenticated
  //     const foundTournament = allTournaments.find(
  //       (t) => t.id === parseInt(id)
  //     );
  //     setTournament(foundTournament || null);
  //   }
  // }, [isAuthenticated, isLoading, id, router]);
  useEffect(() => {
    // Find and set tournament data without authentication check
    const foundTournament = allTournaments.find(
      (t) => t.id === parseInt(id)
    );
    setTournament(foundTournament || null);
  }, [id]);
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div id="preloader"></div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirection will happen in useEffect)
  

  // If no tournament found after loading
  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Tournament not found</p>
      </div>
    );
  }
 

  

  const handleRegistration = () => {
    window.open(tournament.registrationForm, "_blank");
  };


  const getPrizeBackgroundColor = (prizeKey) => {
    switch (prizeKey) {
      case "first":
        return "bg-yellow-100";
      case "runnerUp":
        return "bg-gray-100";
      case "manOfTheTournament":
        return "bg-orange-100";
      default:
        return "bg-blue-100";
    }
  };

  const getPrizeTitle = (prizeKey) => {
    switch (prizeKey) {
      case "first":
        return "1st Prize";
      case "runnerUp":
        return "Runner Up";
      case "manOfTheTournament":
        return "Man of the Tournament";
      default:
        return prizeKey;
    }
  };

  const renderPriceDisplay = () => {
    if (tournament.id === 1) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold line-through text-gray-500">
              ₹{tournament.entryFee}
            </p>
            <p className="text-2xl font-bold text-blue-600">₹1950</p>
            <p className="text-gray-600">per {tournament.priceType}</p>
          </div>
          <p className="text-sm text-green-600">
            1 Pc Playnue Official Merchandise Free
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-blue-600">
          ₹{tournament.entryFee}
        </p>
        <p className="text-gray-600">per {tournament.priceType}</p>
      </div>
    );
  };

  const renderPrizes = () => {
    if (!tournament?.prizes) return null;

    const prizeEntries = Object.entries(tournament.prizes);
    const gridCols =
      prizeEntries.length <= 3
        ? `grid-cols-${prizeEntries.length}`
        : "grid-cols-3";

    return (
      <div>
        <h3 className="text-xl font-semibold mb-2">Prize Pool</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(tournament.prizes).map(([key, value]) => (
            <div
              key={key}
              className={`text-center p-4 ${getPrizeBackgroundColor(
                key
              )} rounded shadow-sm transition-transform hover:scale-105`}
            >
              <p className="font-bold mb-2">{getPrizeTitle(key)}</p>
              <p className="text-lg">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
            <p className="text-xl text-gray-600">{tournament.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - 8 columns */}
            <div className="lg:col-span-8">
              <div className="space-y-8">
                {/* Tournament Details Card */}
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Tournament Details</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600">Sport</p>
                          <p className="font-semibold">{tournament.sport}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Venue</p>
                          <p className="font-semibold">{tournament.venue}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-semibold">
                            {new Date(tournament.startDate).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-semibold">
                            {new Date(tournament.endDate).toLocaleDateString(
                              "en-US",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          Instructions
                        </h3>
                        <ul className="list-disc list-inside space-y-1">
                          {tournament.instructions?.map((rule, index) => (
                            <li key={index}>{rule}</li>
                          ))}
                        </ul>
                      </div>

                      {renderPrizes()}
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Details Card */}
                <Card>
                  <CardHeader>
                    <h2 className="text-2xl font-bold">Registration Details</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {renderPriceDisplay()}
                      <div>
                        <p className="text-gray-600">Teams Registered</p>
                        <p className="font-semibold">
                          {tournament.teamsRegistered} / {tournament.maxTeams}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${
                                (tournament.teamsRegistered /
                                  tournament.maxTeams) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleRegistration}
                      >
                        Register and Pay
                      </Button>

                      <div className="text-sm text-gray-500 text-center mt-4">
                        <p>
                          Click above to fill the registration form and make
                          payment via UPI
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar - 4 columns */}
            <div className="lg:col-span-4 space-y-8">
              {/* Tournament Image Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="relative w-full aspect-[4/5]">
                    <Image
                      src={tournament.image}
                      alt={tournament.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                      priority
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">Location</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{tournament.area}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TournamentDetails;
