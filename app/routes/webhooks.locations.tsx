import { ActionFunctionArgs } from "@remix-run/node";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { topic, shop, session, payload } = await authenticate.webhook(request);

    if (!session) {
        throw new Response();
    }
    if (topic === "LOCATIONS_CREATE") {
        await prisma.pickupMethods.create({
            data: {
                name: payload.name,
                locationId: payload.admin_graphql_api_id,
                description: `${payload.address1} ${payload.address2} ${payload.city} ${payload.country} ${payload.zip}`,
                sessionId: session.id,
            },
        });

        console.log("Location created");
    } else if (topic === "LOCATIONS_UPDATE") {
        console.log("Location updated");
    } else if (topic === "LOCATIONS_DELETE") {
        await prisma.pickupMethods.delete({
            where: {
                locationId: payload.admin_graphql_api_id,
            },
        });
        console.log("Location deleted");
    }

    return new Response();
}