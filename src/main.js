import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { createRouter, createWebHashHistory } from 'vue-router'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { i18n } from './i18n/index.js'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import ConverterView from './views/ConverterView.vue'
import KeyGeneratorView from './views/KeyGeneratorView.vue'
import EncrypterView from './views/EncrypterView.vue'
import DecrypterView from './views/DecrypterView.vue'
import FileHasherView from './views/FileHasherView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/converter', component: ConverterView },
    { path: '/key-generator', component: KeyGeneratorView },
    { path: '/encrypter', component: EncrypterView },
    { path: '/decrypter', component: DecrypterView },
    { path: '/file-hasher', component: FileHasherView },
  ],
})

// Material You (MD3) color roles — seed: Blue Grey #607D8B
const vuetify = createVuetify({
  blueprint: md3,
  components,
  directives,
  theme: {
    defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          // Primary
          primary:                '#37618E',
          'on-primary':           '#FFFFFF',
          'primary-container':    '#D1E4FF',
          'on-primary-container': '#001D36',
          // Secondary
          secondary:              '#535F70',
          'on-secondary':         '#FFFFFF',
          'secondary-container':  '#D7E3F7',
          'on-secondary-container':'#0F1D2B',
          // Tertiary
          tertiary:               '#6B5778',
          'on-tertiary':          '#FFFFFF',
          'tertiary-container':   '#F2DAFF',
          'on-tertiary-container':'#251431',
          // Error
          error:                  '#BA1A1A',
          'on-error':             '#FFFFFF',
          'error-container':      '#FFDAD6',
          'on-error-container':   '#410002',
          // Surface
          background:             '#F8F9FF',
          'on-background':        '#191C20',
          surface:                '#F8F9FF',
          'on-surface':           '#191C20',
          'surface-variant':      '#DFE2EB',
          'on-surface-variant':   '#42474E',
          outline:                '#72787E',
          'outline-variant':      '#C2C7CF',
          'surface-tint':         '#37618E',
          'inverse-surface':      '#2E3136',
          'inverse-on-surface':   '#EFF0F7',
          'inverse-primary':      '#9FCAFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary:                '#9FCAFF',
          'on-primary':           '#003258',
          'primary-container':    '#1A497C',
          'on-primary-container': '#D1E4FF',
          secondary:              '#BBC7DB',
          'on-secondary':         '#253140',
          'secondary-container':  '#3B4858',
          'on-secondary-container':'#D7E3F7',
          tertiary:               '#D6BEE4',
          'on-tertiary':          '#3B2948',
          'tertiary-container':   '#523F5F',
          'on-tertiary-container':'#F2DAFF',
          error:                  '#FFB4AB',
          'on-error':             '#690005',
          'error-container':      '#93000A',
          'on-error-container':   '#FFDAD6',
          background:             '#111318',
          'on-background':        '#E2E2E9',
          surface:                '#111318',
          'on-surface':           '#E2E2E9',
          'surface-variant':      '#42474E',
          'on-surface-variant':   '#C2C7CF',
          outline:                '#8C9199',
          'outline-variant':      '#42474E',
          'surface-tint':         '#9FCAFF',
          'inverse-surface':      '#E2E2E9',
          'inverse-on-surface':   '#2E3136',
          'inverse-primary':      '#37618E',
        },
      },
    },
  },
})

createApp(App).use(router).use(vuetify).use(i18n).mount('#app')
