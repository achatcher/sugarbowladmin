// amplify/data/resource.ts
import { defineData, defineTable } from '@aws-amplify/backend';

export const data = defineData({
  BurgerOfTheMonth: defineTable({
    partitionKey: 'id',
    columns: {
      id: 'string',
      name: 'string',
      description: 'string',
      price: 'number',
      imageKey: 'string',
      startDate: 'string',
      endDate: 'string',
    },
  }),
});