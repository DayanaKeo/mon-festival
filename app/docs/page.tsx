"use client";

import { useEffect } from "react";
import "swagger-ui-dist/swagger-ui.css";

export default function DocsPage() {
  useEffect(() => {
    import("swagger-ui-dist/swagger-ui-bundle").then((SwaggerUIBundle) => {
      SwaggerUIBundle.default({
        url: "/api/openapi", // Ensure this matches the route serving the OpenAPI spec
        dom_id: "#swagger-ui",
      });
    });
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <div id="swagger-ui" />
    </div>
  );
}
