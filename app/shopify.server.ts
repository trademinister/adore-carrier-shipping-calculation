import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  hooks: {
    afterAuth: async ({ session, admin }) => {
      const shopLocations = await admin.graphql(`
        #graphql
        query getLocations{
          locations(first: 250){
            nodes{
              id
              name
              address{
                address1
                address2
                city
                country
                zip
              }
            }
          }
        }
      `);

      const dataLocations = (await shopLocations.json())?.data?.locations?.nodes;

      for (const location of dataLocations || []) {
        await prisma.pickupMethods.create({
          data: {
            locationId: location.id,
            name: location.name,
            description: `${location.address.address1} ${location.address.address2} ${location.address.city} ${location.address.country} ${location.address.zip}`,
            sessionId: session.id,
          },
        });
      }

      await prisma.shippingMethod.create({
        data: {
          name: "Shipping",
          description: "Shipping description",
          sessionId: session.id,
        },
      });
    },
  },
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
