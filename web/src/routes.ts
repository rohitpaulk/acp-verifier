import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  layout("./routes/layout.tsx", [index("./routes/home.tsx"), route(":slug", "./routes/agent.tsx")]),
  route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig;
