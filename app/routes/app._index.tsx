import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  BlockStack,
  TextField,
  InlineStack,
  Text,
  Divider,
  Box,
} from "@shopify/polaris";
import { SaveBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { useField, useForm } from "@shopify/react-form";
import { useEffect, useState, useRef } from "react";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shopifySession = await prisma.session.findUnique({
    where: {
      id: session.id,
    },
  });

  const shippingMethod = await prisma.shippingMethod.findUnique({
    where: {
      sessionId: session.id,
    },
  });

  const pickupMethods = await prisma.pickupMethods.findMany({
    where: {
      sessionId: session.id,
    },
  });

  return {
    shippingMethod: shippingMethod,
    pickupMethods: pickupMethods,
    carrierServiceId: shopifySession?.carrierServiceId,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  const data = await request.formData();
  const action = data.get("action");

  if (action === "create") {
    const response = await admin.graphql(
      `
      #graphql
      mutation CarrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {
        carrierServiceCreate(input: $input) {
          carrierService {
            id
            name
            callbackUrl
            active
            supportsServiceDiscovery
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            name: "Carrier Shipping Service",
            callbackUrl: `${(process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "")}/callback/carrier-shipping`,
            supportsServiceDiscovery: true,
            active: true,
          },
        },
      },
    );

    const json = await response.json();
    console.log(json.data, "CREATED");

    if (!json.data?.carrierServiceCreate?.userErrors.length) {
      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          carrierServiceId: json.data?.carrierServiceCreate?.carrierService?.id,
        },
      });
    }
  } else if (action === "delete") {
    const response = await admin.graphql(
      `#graphql
      mutation CarrierServiceDelete($id: ID!) {
        carrierServiceDelete(id: $id) {
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: data.get("id") as string,
        },
      },
    );

    const json = await response.json();

    if (!json.data?.carrierServiceDelete?.userErrors.length) {
      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          carrierServiceId: null,
        },
      });
    }
  } else if (action === "save") {
    const shippingMethod = await prisma.shippingMethod.findFirst({
      where: {
        sessionId: session.id,
      },
    });

    if (shippingMethod?.id) {
      await prisma.shippingMethod.update({
        where: { id: shippingMethod.id },
        data: {
          name: data.get("shippingMethodName") as string,
          description: data.get("shippingMethodDescription") as string,
        },
      });
    }

    let localPickupMethods: any[] = [];
    const pickupMethodsRaw = data.get("pickupMethods");
    if (typeof pickupMethodsRaw === "string") {
      try {
        localPickupMethods = JSON.parse(pickupMethodsRaw);
      } catch (e) {
        localPickupMethods = [];
      }
    } else if (Array.isArray(pickupMethodsRaw)) {
      localPickupMethods = pickupMethodsRaw;
    }

    for (const pickupMethod of localPickupMethods) {
      if (pickupMethod?.id) {
        await prisma.pickupMethods.update({
          where: { id: pickupMethod.id },
          data: {
            name: pickupMethod.name,
            description: pickupMethod.description,
            zapietId: pickupMethod.zapietId,
          },
        });
      } else if (pickupMethod?.locationId) {
        await prisma.pickupMethods.update({
          where: { locationId: pickupMethod.locationId },
          data: {
            name: pickupMethod.name,
            description: pickupMethod.description,
            zapietId: pickupMethod.zapietId,
          },
        });
      }
    }
  }

  return new Response(JSON.stringify({ message: "success" }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const { shippingMethod, pickupMethods, carrierServiceId } =
    useLoaderData<typeof loader>();
  const [localPickupMethods, setLocalPickupMethods] = useState<any[]>([]);
  const [pickupMethodsDirty, setPickupMethodsDirty] = useState(false);

  const prevPickupMethodsRef = useRef<any[]>([]);
  useEffect(() => {
    prevPickupMethodsRef.current = pickupMethods.map((m: any) => ({ ...m }));
  }, [pickupMethods]);

  useEffect(() => {
    setLocalPickupMethods(pickupMethods.map((m: any) => ({ ...m })));
  }, [pickupMethods]);

  useEffect(() => {
    if (localPickupMethods.length !== pickupMethods.length) {
      setPickupMethodsDirty(true);
      return;
    }
    const isDifferent = localPickupMethods.some((local, idx) => {
      const db = pickupMethods[idx];
      return (
        local.id !== db.id ||
        local.name !== db.name ||
        local.description !== db.description ||
        local.zapietId !== db.zapietId
      );
    });
    setPickupMethodsDirty(isDifferent);
  }, [localPickupMethods, pickupMethods]);

  const handleSaveShippingMethods = (values: any) => {
    fetcher.submit(
      {
        action: "save",
        shippingMethodName: values.shippingMethodName,
        shippingMethodDescription: values.shippingMethodDescription,
        pickupMethods: JSON.stringify(localPickupMethods),
      },
      {
        method: "POST",
        encType: "multipart/form-data",
      },
    );
  };

  const {
    fields: { shippingMethodName, shippingMethodDescription },
    submit: submitShippingMethod,
    dirty,
    reset,
  } = useForm({
    fields: {
      shippingMethodName: useField({
        value: shippingMethod?.name,
        validates: [],
      }),
      shippingMethodDescription: useField({
        value: shippingMethod?.description || "",
        validates: [],
      }),
    },
    onSubmit: async (values) => {
      handleSaveShippingMethods(values);
      return {
        status: "success",
      };
    },
  });

  const createShippingService = () =>
    fetcher.submit({ action: "create" }, { method: "POST" });

  const deleteShippingService = () =>
    fetcher.submit(
      {
        action: "delete",
        id: carrierServiceId ? carrierServiceId : null,
      },
      { method: "POST" },
    );

  useEffect(() => {
    if (dirty || pickupMethodsDirty) {
      shopify.saveBar.show("save-bar");
    } else {
      shopify.saveBar.hide("save-bar");
    }
  }, [dirty, pickupMethodsDirty]);

  useEffect(() => {
    if (fetcher.data?.message === "success") {
      shopify.toast.show("Saved");
    }
  }, [fetcher.data]);

  const handleDiscard = () => {
    reset();
    setLocalPickupMethods(prevPickupMethodsRef.current.map((m) => ({ ...m })));
  };

  return (
    <Page
      title="Carrier Shipping Service"
      secondaryActions={[
        {
          content: "Delete Service",
          destructive: true,
          onAction: deleteShippingService,
          icon: DeleteIcon,
          disabled: carrierServiceId ? false : true,
          loading:
            fetcher.state === "submitting" || fetcher.state === "loading",
        },
        {
          content: "Create Service",
          onAction: createShippingService,
          icon: PlusIcon,
          disabled: !carrierServiceId ? false : true,
          loading:
            fetcher.state === "submitting" || fetcher.state === "loading",
        },
      ]}
    >
      <Card padding="0">
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            submitShippingMethod();
          }}
        >
          <Box padding={"400"}>
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Shipping Method
              </Text>
              <InlineStack gap="200" wrap={false}>
                <div style={{ width: "50%" }}>
                  <TextField
                    label="Name"
                    autoComplete="off"
                    {...shippingMethodName}
                  />
                </div>
                <div style={{ width: "50%" }}>
                  <TextField
                    label="Description"
                    autoComplete="off"
                    {...shippingMethodDescription}
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Box>
          <Divider />
          <Box padding={"400"}>
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Pickup Methods
              </Text>
              {localPickupMethods.map((method, index) => (
                <InlineStack gap="200" wrap={false} key={index}>
                  <div style={{ width: "100%" }}>
                    <TextField
                      label="Name"
                      autoComplete="off"
                      value={method.name}
                      onChange={(value) => {
                        setLocalPickupMethods(
                          localPickupMethods.map((m) =>
                            m.id === method.id ? { ...m, name: value } : m,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div style={{ width: "100%" }}>
                    <TextField
                      label="Description"
                      autoComplete="off"
                      value={method.description}
                      onChange={(value) => {
                        setLocalPickupMethods(
                          localPickupMethods.map((m) =>
                            m.id === method.id
                              ? { ...m, description: value }
                              : m,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div style={{ width: "100%" }}>
                    <TextField
                      label="Zepiet ID"
                      autoComplete="off"
                      value={method.zapietId}
                      onChange={(value) => {
                        setLocalPickupMethods(
                          localPickupMethods.map((m) =>
                            m.id === method.id ? { ...m, zapietId: value } : m,
                          ),
                        );
                      }}
                    />
                  </div>
                </InlineStack>
              ))}
            </BlockStack>
          </Box>
        </Form>
      </Card>
      <SaveBar id="save-bar">
        <button
          variant="primary"
          id="save-button"
          loading={
            fetcher.state === "submitting" || fetcher.state === "loading"
              ? ""
              : undefined
          }
          onClick={submitShippingMethod}
        ></button>
        <button
          id="discard-button"
          type="button"
          loading={
            fetcher.state === "submitting" || fetcher.state === "loading"
              ? ""
              : undefined
          }
          onClick={handleDiscard}
        />
      </SaveBar>
    </Page>
  );
}
