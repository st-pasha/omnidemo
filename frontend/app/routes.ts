import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/insights", "routes/insights/list-insights.tsx"),
  route("/inputs", "routes/inputs/list-inputs.tsx"),
] satisfies RouteConfig;
