import common from './common.json'
import home from './home.json'
import navigation from './navigation.json'
import dashboard from './dashboard.json'
import employees from './employees.json'
import subscriptions from './subscriptions.json'
import alerts from './alerts.json'
import reports from './reports.json'
import settings from './settings.json'
import integrations from './integrations.json'
import errors from './errors.json'
import auth from './auth.json'

const messages = {
  common,
  home,
  navigation,
  dashboard,
  employees,
  subscriptions,
  alerts,
  reports,
  settings,
  integrations,
  errors,
  auth,
} as const

export default messages
