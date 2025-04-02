import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Omnifold" }];
}

export default function Home() {
  return (
    <div>
      <b>Hello</b>
    </div>
  );
}
