"use client";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProfileForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
    favoriteSports: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [sportsList, setSportsList] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const user = useUserData();
  const accessToken = useAccessToken();

  const fetchSportsList = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetSports {
              sports {
                id
                name
              }
            }
          `,
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      setSportsList(data.sports);
    } catch (error) {
      console.error("Error fetching sports list:", error);
    }
  };

  const saveUserDetails = async () => {
    if (!formData.firstName || !formData.phone) {
      toast.error("Name and phone number are required!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateUser($id: uuid!, $displayName: String!, $phoneNumber: String!, $metadata: jsonb) {
              updateUser(
                pk_columns: { id: $id },
                _set: { 
                  displayName: $displayName, 
                  phoneNumber: $phoneNumber, 
                  metadata: $metadata 
                }
              ) {
                id
                displayName
                phoneNumber
                metadata
              }
            }
          `,
          variables: {
            id: user?.id,
            displayName: formData.firstName,
            phoneNumber: formData.phone,
            metadata: { sports: formData.favoriteSports },
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        toast.error("Failed to update profile. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      toast.success("Profile updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSport = () => {
    if (selectedSport && !formData.favoriteSports.includes(selectedSport)) {
      setFormData((prev) => ({
        ...prev,
        favoriteSports: [...prev.favoriteSports, selectedSport],
      }));
      setSelectedSport("");
    }
  };

  const removeSport = (sportToRemove) => {
    setFormData((prev) => ({
      ...prev,
      favoriteSports: prev.favoriteSports.filter(
        (sport) => sport !== sportToRemove
      ),
    }));
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserDetails(user.id);
      fetchSportsList();
    }
  }, [user]);

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "x-hasura-role": "user",
        },
        body: JSON.stringify({
          query: `
            query GetUser($id: uuid!) {
              user(id: $id) {
                displayName
                email
                phoneNumber
                metadata
              }
            }
          `,
          variables: { id: userId },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      setFormData({
        firstName: data?.user?.displayName || "",
        phone: data?.user?.phoneNumber || "",
        favoriteSports: data?.user?.metadata?.sports || [],
      });

      // Set loyalty points from metadata
      setLoyaltyPoints(data?.user?.metadata?.loyaltyPoints || 0);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };
  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-white shadow-lg overflow-hidden">
                <img
                  src="/user.jpeg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-blue-700">
                  Loyalty Points
                </h4>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {loyaltyPoints}
                </p>
              </div>
            </div>
            
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm text-gray-600 flex items-center">
                Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Phone Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="+91"
                  disabled
                  className="w-16 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-500"
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-200"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600 flex items-center">
                Email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                value={user?.email}
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200"
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Favorite Sports</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <option value="">Select a Sport</option>
                  {sportsList.map((sport) => (
                    <option key={sport.id} value={sport.name}>
                      {sport.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addSport}
                  className="p-3 rounded-lg bg-green-500 text-white hover:bg-green-600"
                >
                  Add
                </button>
              </div>

              {formData.favoriteSports.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Selected Sports:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.favoriteSports.map((sport) => (
                      <div
                        key={sport}
                        className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                      >
                        {sport}
                        <button
                          onClick={() => removeSport(sport)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={saveUserDetails}
              className="w-full p-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileForm;
