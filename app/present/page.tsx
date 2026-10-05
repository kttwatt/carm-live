"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/room";

// The presenter page moved to /control; old links and QR codes forward there with their ?r= and ?k=.
export default function PresentRedirect() {
  useEffect(() => {
    window.location.replace(`${BASE_PATH}/control${window.location.search}`);
  }, []);
  return null;
}
