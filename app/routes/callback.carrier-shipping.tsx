import type { ActionFunctionArgs } from "@remix-run/node";
import prisma from "app/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = await request.json();

  let locationName = null;
  let locationDescription = null;

  const shippingMethod = await prisma.shippingMethod.findFirst();

  const pickupMethod = await prisma.pickupMethods.findMany();

  
  for (const item of data.rate.items) {
    const zapietId = item.properties._ZapietId;
    console.log(item.properties);
    if (zapietId) {
      const params = new URLSearchParams(zapietId.replace(/&/g, "&"));
      if (params.get("M") === "P") {
        const currentPickupMethod = pickupMethod.find(
          (method: any) => method.zapietId === params.get("L"),
        );
        locationName = currentPickupMethod?.name;
        locationDescription = currentPickupMethod?.description;
      } else if (params.get("M") === "S") {
        locationName = shippingMethod?.name;
        locationDescription = shippingMethod?.description;
      }
    }
  }

  const myRates = [
    {
      service_name: `.${locationName}`,
      service_code: ".method",
      total_price: "0",
      currency: data.rate.currency,
      // min_delivery_date: new Date(Date.now()).toISOString(),
      // max_delivery_date: new Date(
      //   Date.now() + 1000 * 60 * 60 * 24 * 30,
      // ).toISOString(),
      description: locationDescription,
    },
  ];

  return new Response(
    JSON.stringify({
      rates: myRates,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
