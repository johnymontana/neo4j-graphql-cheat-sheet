import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import "dotenv/config";

const { NEO4J_USER, NEO4J_PASSWORD, NEO4J_URI, NEO4J_DATABASE } =
  process.env;

const typeDefs = `#graphql

type City {
  name: String!
  airports: [Airport!]! @relationship(type: "IN_CITY", direction: IN)
}

type Region {
  name: String!
  airports: [Airport!]! @relationship(type: "IN_REGION", direction: IN)
  cities: [City!]! @relationship(type: "IN_REGION", direction: OUT)
}

type Country {
  code: String!
  airports: [Airport!]! @relationship(type: "IN_COUNTRY", direction: IN)
}

type Airport {
  iata: String!
  location: Point!
  runways: Int
  longest: Int
  descr: String
  routes: [Airport!]! @relationship(type: "HAS_ROUTE", direction: OUT)
}
`;

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({
  schema: await neoSchema.getSchema(),
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => ({
    req,
    sessionConfig: { database: NEO4J_DATABASE },
  }),
  listen: { port: 4000 },
});

console.log(`Server ready at ${url}`);
