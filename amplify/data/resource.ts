import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  BurgerOfMonth: a.model({
    id: a.id(),
    name: a.string(),
    description: a.string(),
    price: a.float(),
    startDate: a.string(),
    endDate: a.string(),
    imageKey: a.string(),
  }).authorization(allow => [allow.publicApiKey()]),

  MenuItems: a.model({
    id: a.id(),
    name: a.string(),
    description: a.string(),
    price: a.float(),
    category: a.string(),
    available: a.boolean(),
    published: a.boolean(),
  }).authorization(allow => [allow.publicApiKey()]),
});

// Type for frontend usage
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 }
  }
});