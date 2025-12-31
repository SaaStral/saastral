import { Messages } from './src/messages/en-US'

declare global {
  // Type for next-intl
  interface IntlMessages extends Messages {}
}
