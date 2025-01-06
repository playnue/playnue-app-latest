"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
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

  // Sample tournament data remains the same
  const allTournaments = [
    {
      id: 1,
      name: "Cricket Tournament",
      sport: "Cricket",
      area: "B-1/130 SECTOR-G ALIGANJ LUCKNOW NEAR COLD-STORAGE (GULAB VATIKA",
      entryFee: 2000,
      startDate: "2025-01-25",
      endDate: "2025-01-26",
      venue: "Playturf",
      teamsRegistered: 10,
      players: 11,
      maxTeams: 16,
      priceType: "team",
      status: "open",
      image: "/playturfTournament.jpg",
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
        manOfTheMatch: "₹2,000",
      },
      registrationForm: "https://forms.gle/87pRZJ81iMYdF7sj6",
    },
    {
      id: 2,
      name: "8 Ball Pool Tournament",
      sport: "Pool",
      area: "JC Guest House 8 no chauraha, Nirala Nagar near Regrant Hotel, Lucknow, Uttar Pradesh 226020",
      entryFee: 500,
      startDate: "2025-01-19",
      endDate: "2025-01-19",
      venue: "Cue Lords: Snooker, Pool and Cafe",
      priceType: "player",
      teamsRegistered: 0,
      players: 1,
      maxTeams: 16,
      status: "Coming Soon",
      image: "/cueLords.jpg",
      description:
        "Join the most prestigious 8 Ball Pool tournament in Lucknow. Players from across the city compete for the championship title.",
      instructions: [
        "Registration Closes on 15th January 2024",
        "Draw will be shared on 16th January 2024",
        "Reporting and entry must be 15 minutes prior to your timings",
        "Participants reporting late will be automatically  disqualified",
        "Tournament Governed by the house rules",
        "Umpire decision is last and final decision",
        "All players shall participate in good sportsmanship",
      ],
      prizes: {
        first: "₹2,500",
        runnerUp: "₹1,500",
      },
      registrationForm:
        "https://docs.google.com/forms/d/e/1FAIpQLSfyzLAi2-3EMNMMnPxst_Bf4Hudm8KEIGvzhPwSUIGfEKINTA/viewform",
    },
  ];

  useEffect(() => {
    const foundTournament = allTournaments.find((t) => t.id === parseInt(id));
    setTournament(foundTournament || null);
  }, [id]);

  const handleRegistration = () => {
    window.open(tournament.registrationForm, "_blank");
  };

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div id="preloader"></div>
      </div>
    );
  }

  const getPrizeBackgroundColor = (prizeKey) => {
    switch (prizeKey) {
      case "first":
        return "bg-yellow-100";
      case "runnerUp":
        return "bg-gray-100";
      case "manOfTheMatch":
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
      case "manOfTheMatch":
        return "Man of the Match";
      default:
        return prizeKey;
    }
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
        <div className={`grid ${gridCols} gap-4`}>
          {prizeEntries.map(([key, value]) => (
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
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          ₹{tournament.entryFee}
                        </p>
                        <p className="text-gray-600">
                          per {tournament.priceType}
                        </p>
                      </div>
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
                        Register and pay
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
