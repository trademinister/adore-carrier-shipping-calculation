/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type CarrierServiceCreateMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.DeliveryCarrierServiceCreateInput;
}>;


export type CarrierServiceCreateMutation = { carrierServiceCreate?: AdminTypes.Maybe<{ carrierService?: AdminTypes.Maybe<Pick<AdminTypes.DeliveryCarrierService, 'id' | 'name' | 'callbackUrl' | 'active' | 'supportsServiceDiscovery'>>, userErrors: Array<Pick<AdminTypes.CarrierServiceCreateUserError, 'field' | 'message'>> }> };

export type CarrierServiceDeleteMutationVariables = AdminTypes.Exact<{
  id: AdminTypes.Scalars['ID']['input'];
}>;


export type CarrierServiceDeleteMutation = { carrierServiceDelete?: AdminTypes.Maybe<{ userErrors: Array<Pick<AdminTypes.CarrierServiceDeleteUserError, 'field' | 'message'>> }> };

export type GetLocationsQueryVariables = AdminTypes.Exact<{ [key: string]: never; }>;


export type GetLocationsQuery = { locations: { nodes: Array<(
      Pick<AdminTypes.Location, 'id' | 'name'>
      & { address: Pick<AdminTypes.LocationAddress, 'address1' | 'address2' | 'city' | 'country' | 'zip'> }
    )> } };

interface GeneratedQueryTypes {
  "\n        #graphql\n        query getLocations{\n          locations(first: 250){\n            nodes{\n              id\n              name\n              address{\n                address1\n                address2\n                city\n                country\n                zip\n              }\n            }\n          }\n        }\n      ": {return: GetLocationsQuery, variables: GetLocationsQueryVariables},
}

interface GeneratedMutationTypes {
  "\n      #graphql\n      mutation CarrierServiceCreate($input: DeliveryCarrierServiceCreateInput!) {\n        carrierServiceCreate(input: $input) {\n          carrierService {\n            id\n            name\n            callbackUrl\n            active\n            supportsServiceDiscovery\n          }\n          userErrors {\n            field\n            message\n          }\n        }\n      }": {return: CarrierServiceCreateMutation, variables: CarrierServiceCreateMutationVariables},
  "#graphql\n      mutation CarrierServiceDelete($id: ID!) {\n        carrierServiceDelete(id: $id) {\n          userErrors {\n            field\n            message\n          }\n        }\n      }": {return: CarrierServiceDeleteMutation, variables: CarrierServiceDeleteMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
