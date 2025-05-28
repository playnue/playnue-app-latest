"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import "../../loader.css";
import Head from "next/head";

interface VenueDetails {
  id: string;
  title: string;
  address: string;
  description: string;
  sports: string[];
  amenities: string[];
  extra_image_ids: string[];
  location: string;
  open_at: string;
  close_at: string;
  slug: string;
  rating?: number;
  reviews?: number;
}

const sportIcons = {
  Football: " ⚽ ",
  Basketball: " 🏀 ",
  Cricket: " 🏏 ",
  Golf: " ⛳ ",
  Pickleball: " 🎾 ",
  Badminton: " 🏸 ",
  Tennis: " 🎾 ",
  BoxCricket: " 🏏 ",
  Snooker: " 🎱🥢 ",
  Pool: "🎱",
  PS4: "🎮",
  LawnTennis: "🎾",
  Cricket_Net: "🏏",
};

const VenuePage = () => {
  const { slug } = useParams();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(`/book-now/${venue.id}`);
  };

  // Fetch data from Hasura using the slug
  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
              query GetVenueBySlug {
                venues(where: {slug: {_eq: "${slug}"}}) {
                  id
                  title
                  description
                  sports
                  amenities
                  image_id
                  location
                  open_at
                  close_at
                  slug
                  
                }
              }
            `,
            }),
          }
        );

        const data = await response.json();
        if (data.errors) {
          throw new Error("Failed to fetch venue data");
        }

        if (data.data.venues.length === 0) {
          setError("Venue not found");
        } else {
          setVenue(data.data.venues[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching venue:", error);
        setError("Failed to load venue information");
        setLoading(false);
      }
    };

    if (slug) {
      fetchVenueDetails();
    }
  }, [slug]);

  const getImageSource = (id) => {
    switch (id) {
      case "063a2e3f-8365-40f3-8613-9613f6024d78":
        return "/cueLords.jpg";
      case "25d039e0-8a4d-49b1-ac06-5439c3af4a6f":
        return "/playturf.jpg";
      case "dfac7e28-16d2-45ff-93d9-add6a0a006e2":
        return "/bsa.jpg";
      case "d718a6cf-e982-42cf-b383-825134db21f6":
        return "/playerTown.jpg";
      case "cb9162ae-c5c2-44a9-ab6a-8c496f253a34":
        return "/playerTown.jpg";
      case "de83245f-6326-4373-9a54-d3137bd1a125":
        return "/lpg.jpg";
      case "36b6825d-ba31-4a8f-aa06-5dfd0ec71e8e":
        return "/lpg.jpg";
      case "9e0ebacb-1667-4e23-ac6e-628fe534b08b":
        return "/dugouti.jpg";
      case "e252f954-548c-4463-bbaf-e3323475fd6f":
        return "/gj.jpg";
      case "3f4c9df0-2a4e-48d3-a11e-c2083dc38f1d":
        return "/dbi.jpg";
      case "2775568b-4776-4f51-a0c0-6b24646624b4":
        return "/ppi.jpg";
      case "8e2ab06a-8d23-4fc5-858e-44118d3e0f28":
        return "/partyPolyin.jpg";
      case "562cb30c-f543-4f19-86fd-a424c4265091":
        return "/picklepro.jpg";
      case "0dbd3a09-30f4-4e34-b178-a6a7c4398255":
        return "/tt2.jpg";
      case "8158e7e5-714e-4fb6-b7b9-0668a3180e04":
        return "/arcadia.webp";
      case "37d1eeb4-d8b6-4edd-a6db-fb3cb8b8457b":
        return "/infinity.jpg";
      case "ae50b3c5-9129-45c6-8d59-6d1c90bf5f9b":
        return "/sportsSquare.webp";
      case "cfde78ee-6686-475d-b343-1ca966023db7":
        return "/lordsCricket.webp";
      case "c6be6c46-0355-4f59-bee4-1c4066e5de92":
        return "/nextgen.jpg";
      case "e062a12e-c969-446e-a239-c3ca921f97da":
        return "/athin.jpg";
        case "efab4779-e5a2-456a-8a88-1a3bb123b0bb":
          return "/gsai.jpg";
      default:
        return "/playturf.jpg";
    }
  };

  const imageSource = venue ? getImageSource(venue.id) : "/placeholder.jpg";

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate structured data for SEO
  const generateStructuredData = () => {
    if (!venue) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      name: venue.title,
      description: venue.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: venue.location,
      },
      openingHours:
        venue.open_at === "00:00:00" && venue.close_at === "00:00:00"
          ? "Mo-Su 00:00-24:00"
          : `Mo-Su ${venue.open_at}-${venue.close_at}`,
      image: `${process.env.NEXT_PUBLIC_SITE_URL}${imageSource}`,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/venue/${venue.slug}`,
      amenityFeature: venue.amenities?.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity,
      })),
      sportActivityLocation: venue.sports?.map(sport => ({
        "@type": "LocationFeatureSpecification",
        name: sport
      }))
    };

    return JSON.stringify(structuredData);
  };

  // Create meta title and description using venue data
  const metaTitle = venue 
    ? `${venue.title} - Book Sports Venue in ${venue.location} | PlaySports` 
    : "Loading Venue | PlaySports";
    
  const metaDescription = venue 
    ? `Book ${venue.title} in ${venue.location}. Available sports: ${venue.sports?.join(', ')}. ${venue.open_at === "00:00:00" && venue.close_at === "00:00:00" ? "Open 24/7" : `Open from ${venue.open_at} to ${venue.close_at}`}.` 
    : "Loading venue details. Book sports venues easily with PlaySports.";

  // Create canonical URL for SEO
  const canonicalUrl = venue 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/venue/${venue.slug}` 
    : null;

  // If not client-side, render minimal SSR-compatible content
  if (!isClient) {
    return (
      <>
        <Head>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        </Head>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div id="preloader"></div>
        </div>
      </>
    );
  }

  if (loading)
    return (
      <>
        <Head>
          <title>Loading Venue | PlaySports</title>
          <meta name="description" content="Loading venue details. Book sports venues easily with PlaySports." />
        </Head>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div id="preloader"></div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Head>
          <title>Venue Not Found | PlaySports</title>
          <meta name="description" content="The venue you're looking for doesn't exist or has been removed." />
        </Head>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-[#1a1b26] p-8 rounded-xl">
            <h1 className="text-2xl text-white mb-4">Error</h1>
            <p className="text-gray-300">{error}</p>
            <Link
              href="/"
              className="mt-4 text-purple-400 hover:text-purple-300 block"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </>
    );

  if (!venue)
    return (
      <>
        <Head>
          <title>Venue Not Found | PlaySports</title>
          <meta name="description" content="The venue you're looking for doesn't exist or has been removed." />
        </Head>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-[#1a1b26] p-8 rounded-xl">
            <h1 className="text-2xl text-white mb-4">Venue Not Found</h1>
            <p className="text-gray-300">
              The venue you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="mt-4 text-purple-400 hover:text-purple-300 block"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${venue.title}, ${venue.location}, ${venue.sports?.join(', ')}, sports venue, book sports, PlaySports`} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}${imageSource}`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card data */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL}${imageSource}`} />
        
        {/* Structured data for rich snippets */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
        />
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="bg-[#1a1b26] rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="relative h-96">
              <img
                src={imageSource}
                alt={`${venue.title} - Sports venue in ${venue.location}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {venue.title}
                </h1>
                <p className="text-gray-300 flex items-center">
                  <span className="mr-2">📍</span>
                  {venue.location}
                </p>
              </div>
            </div>

            {/* Venue Details */}
            <div className="p-8">
              {/* Timing Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Operating Hours
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <p className="text-gray-300">
                    ⏰{" "}
                    {venue.open_at === "00:00:00" &&
                    venue.close_at === "00:00:00"
                      ? "24/7"
                      : `${venue.open_at} - ${venue.close_at}`}
                  </p>
                </div>
              </div>

              {/* Sports Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Available Sports
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <div className="flex flex-wrap gap-4">
                    {venue.sports?.map((sport) => (
                      <div
                        key={sport}
                        className="bg-purple-600/20 px-4 py-2 rounded-lg flex items-center"
                      >
                        <span className="text-2xl mr-2">
                          {sportIcons[sport]}
                        </span>
                        <span className="text-white">{sport}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Amenities
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.amenities?.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center text-gray-300"
                      >
                        <span className="text-purple-500 mr-2">✓</span>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  About Venue
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <p className="text-gray-300">{venue.description}</p>
                </div>
              </div>

              {/* Map Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Location
                </h2>
                <div className="bg-[#252632] p-4 rounded-lg">
                  <Link
                    href={`https://google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.title} ${venue.location}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center text-purple-400 hover:text-purple-300 py-4"
                  >
                    <span className="mr-2">🗺️</span>
                    View on Map
                  </Link>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:-translate-y-1 disabled:bg-gray-600 disabled:cursor-not-allowed"
                aria-label={`Book ${venue.title} now`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loader"></div>
                  </div>
                ) : (
                  "Book Now"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VenuePage;