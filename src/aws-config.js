import { Amplify } from 'aws-amplify'
import config from './aws-exports'

Amplify.configure(config, {
  Auth: {
    loginWith: 'USERNAME',
  },
})

export default config
