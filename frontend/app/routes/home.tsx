import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Omnifold" }];
}

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/insights");
  }, []);
  return null;
}
