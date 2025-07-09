// amplify/storage/resource.ts
import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'burgerStorage',
  access: (allow) => ({
    'burgers/*': [allow.authenticated.to(['read', 'write']), allow.guest.to(['read'])],
  }),
})
