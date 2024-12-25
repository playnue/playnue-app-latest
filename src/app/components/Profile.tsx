"use client";
import { nhost } from "@/lib/nhost";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ProfileForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    favoriteSports: "",
  });

  const [user, setUser] = useState();
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [token,setToken] = useState("")
  const [sportsList, setSportsList] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("");
  // const { data: session } = useSession();

  useEffect(() => {
    const item = localStorage.getItem("user");
    if (item) {
      const parsedItem = JSON.parse(item);
      setUser(parsedItem?.user);
      setToken(parsedItem?.accessToken)
    }
  }, []);

  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // if (!isClient) {
  //   return (
  //     <>
  //       {/* <Navbar /> */}
  //       <div className="flex items-center justify-center min-h-screen">
  //         <div id="preloader"></div>
  //       </div>
  //     </>
  //   );
  // }
  const fetchSportsList = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
              query MyQuery {
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

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":`Bearer ${token}`,
          "x-hasura-role":"user",
        },
        body: JSON.stringify({
          query: `
              query MyQuery($id: uuid!) {
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
      console.log(data);
      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }
      const metadata = data?.user?.metadata;
      console.log(metadata);
      // setUser(data?.user);
      setFormData({
        firstName: data?.user?.displayName || "",
        email: data?.user?.email || "",
        phone: data?.user?.phoneNumber,
        // Ensure favoriteSports is an array, even if it's null
        favoriteSports: metadata?.sports,
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const saveUserDetails = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":`Bearer ${token}`,
          
          "x-hasura-role":"user",
        },
        body: JSON.stringify({
          query: `
              mutation UpdateUser($id: uuid!, $displayName: String, $phoneNumber: String, $metadata: jsonb) {
                updateUser(
                  pk_columns: { id: $id },
                  _set: { 
                    displayName: $displayName, 
                    phoneNumber: $phoneNumber, 
                    metadata: $metadata 
                  }
                ) {
                  id
                }
              }
            `,
          variables: {
            id: user?.id,
            displayName: formData.firstName,
            phoneNumber: formData.phone,
            metadata: { sports: formData?.favoriteSports }, // Store as array in metadata
          },
        }),
      });

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        toast.error("Check your inputs", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      } else {
        toast.success("Details updated successful!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error saving user details:", error);
      toast.error("Error occured", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
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
      setSelectedSport(""); // Reset dropdown
    }
  };

  // Remove sport from favorites
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
      fetchUserDetails(user?.id);
      fetchSportsList();
      console.log("hello");
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // useEffect(() => {
  //   // Ensure `user` exists before checking `phoneNumber`
  //   if (user && !user.phoneNumber) {
  //     toast.error("Enter Phone Number", {
  //       position: "top-right",
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //     });
  //   }
  // }, [user]);
  return (
    <>
      <ToastContainer />

      <div className="min-h-screen bg-white p-6">
        <div className="max-w-xl mx-auto">
          {/* Profile Picture */}
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

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="space-y-1">
              <label className="text-sm text-purple-200 flex items-center">
                Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-100"
                placeholder="Name"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-sm text-purple-200">
                Phone No.
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value="+91"
                  disabled
                  className="w-16 p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-500"
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  placeholder="Phone number"
                  // disabled={!!formData.phone}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm text-purple-200 flex items-center">
                Email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-100"
                placeholder="Email address"
                readOnly
              />
            </div>

            {/* Favorite Sports */}
            <div className="space-y-1">
              <label className="text-sm text-purple-200">Favorite Sports</label>
              <div className="flex gap-2 mb-2">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-100"
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

              {/* Display Selected Sports */}
              {/* {formData?.favoriteSports.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-purple-200 mb-1">
                    Selected Sports:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.favoriteSports.map((sport) => (
                      <div
                        key={sport}
                        className="bg-purple-100 px-2 py-1 rounded-full flex items-center text-sm"
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
              )} */}
            </div>

            {/* Save Button */}
            <div className="mt-4">
              <button
                onClick={saveUserDetails}
                className="w-full p-3 rounded-lg bg-green-600 text-white hover:bg-green-600"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Details"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileForm;
