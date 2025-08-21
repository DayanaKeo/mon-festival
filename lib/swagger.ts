// swagger.ts
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Festival API",
      version: "1.0.0",
    },
  },
  apis: ["./app/api/**/*.ts"], // <== il va scanner tes routes
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
