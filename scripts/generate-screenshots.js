import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'http://localhost:5173'
const OUT_DIR = path.resolve(__dirname, '../docs/screenshots')

const VIEWPORTS = {
  phone:    { width: 390,  height: 844  },
  tablet7:  { width: 600,  height: 1024 },
  tablet10: { width: 820,  height: 1180 },
}

async function expandNav(page) {
  await page.click('.app-nav__header button.nav-icon-btn')
  await page.waitForSelector('.app-nav--expanded')
  await page.waitForTimeout(300)
}

async function fillEncrypter(page) {
  await page.locator('textarea, input').first().fill('Hello, CrittoUtil!')
}

async function fillDecrypter(page) {
  await page.locator('textarea, input').first().fill('dGVzdA==')
}

const SCENES = [
  // Phone EN
  { file: 'phone_en_01_home.png',          device: 'phone',    locale: 'en', theme: 'light', route: '/' },
  { file: 'phone_en_02_menu.png',          device: 'phone',    locale: 'en', theme: 'light', route: '/', actions: expandNav },
  { file: 'phone_en_03_converter.png',     device: 'phone',    locale: 'en', theme: 'light', route: '/converter' },
  { file: 'phone_en_04_key_generator.png', device: 'phone',    locale: 'en', theme: 'light', route: '/key-generator' },
  { file: 'phone_en_05_encrypter.png',     device: 'phone',    locale: 'en', theme: 'light', route: '/encrypter', actions: fillEncrypter },
  { file: 'phone_en_06_home_dark.png',     device: 'phone',    locale: 'en', theme: 'dark',  route: '/' },
  { file: 'phone_en_07_home_dark2.png',    device: 'phone',    locale: 'en', theme: 'dark',  route: '/', actions: expandNav },
  // Phone IT
  { file: 'phone_it_01_home.png',          device: 'phone',    locale: 'it', theme: 'light', route: '/' },
  { file: 'phone_it_02_converter.png',     device: 'phone',    locale: 'it', theme: 'light', route: '/converter' },
  { file: 'phone_it_03_key_generator.png', device: 'phone',    locale: 'it', theme: 'light', route: '/key-generator' },
  { file: 'phone_it_04_encrypter.png',     device: 'phone',    locale: 'it', theme: 'light', route: '/encrypter', actions: fillEncrypter },
  // Tablet 7" EN
  { file: 'tablet7_en_01_home.png',          device: 'tablet7',  locale: 'en', theme: 'light', route: '/' },
  { file: 'tablet7_en_02_menu.png',          device: 'tablet7',  locale: 'en', theme: 'light', route: '/', actions: expandNav },
  { file: 'tablet7_en_03_converter.png',     device: 'tablet7',  locale: 'en', theme: 'light', route: '/converter' },
  { file: 'tablet7_en_04_key_generator.png', device: 'tablet7',  locale: 'en', theme: 'light', route: '/key-generator' },
  { file: 'tablet7_en_05_encrypter.png',     device: 'tablet7',  locale: 'en', theme: 'light', route: '/encrypter', actions: fillEncrypter },
  { file: 'tablet7_en_06_decrypter.png',     device: 'tablet7',  locale: 'en', theme: 'light', route: '/decrypter', actions: fillDecrypter },
  { file: 'tablet7_en_07_home_dark.png',     device: 'tablet7',  locale: 'en', theme: 'dark',  route: '/' },
  // Tablet 7" IT
  { file: 'tablet7_it_01_home.png',          device: 'tablet7',  locale: 'it', theme: 'light', route: '/' },
  { file: 'tablet7_it_02_converter.png',     device: 'tablet7',  locale: 'it', theme: 'light', route: '/converter' },
  { file: 'tablet7_it_03_key_generator.png', device: 'tablet7',  locale: 'it', theme: 'light', route: '/key-generator' },
  { file: 'tablet7_it_04_encrypter.png',     device: 'tablet7',  locale: 'it', theme: 'light', route: '/encrypter', actions: fillEncrypter },
  // Tablet 10" EN
  { file: 'tablet10_en_01_home.png',          device: 'tablet10', locale: 'en', theme: 'light', route: '/' },
  { file: 'tablet10_en_02_menu.png',          device: 'tablet10', locale: 'en', theme: 'light', route: '/', actions: expandNav },
  { file: 'tablet10_en_03_converter.png',     device: 'tablet10', locale: 'en', theme: 'light', route: '/converter' },
  { file: 'tablet10_en_04_key_generator.png', device: 'tablet10', locale: 'en', theme: 'light', route: '/key-generator' },
  { file: 'tablet10_en_05_encrypter.png',     device: 'tablet10', locale: 'en', theme: 'light', route: '/encrypter', actions: fillEncrypter },
  { file: 'tablet10_en_06_decrypter.png',     device: 'tablet10', locale: 'en', theme: 'light', route: '/decrypter', actions: fillDecrypter },
  { file: 'tablet10_en_07_home_dark.png',     device: 'tablet10', locale: 'en', theme: 'dark',  route: '/' },
  // Tablet 10" IT
  { file: 'tablet10_it_01_home.png',          device: 'tablet10', locale: 'it', theme: 'light', route: '/' },
  { file: 'tablet10_it_02_converter.png',     device: 'tablet10', locale: 'it', theme: 'light', route: '/converter' },
  { file: 'tablet10_it_03_key_generator.png', device: 'tablet10', locale: 'it', theme: 'light', route: '/key-generator' },
  { file: 'tablet10_it_04_encrypter.png',     device: 'tablet10', locale: 'it', theme: 'light', route: '/encrypter', actions: fillEncrypter },
]

async function captureScene(browser, scene) {
  const { file, device, locale, theme, route, actions } = scene
  const navigatorLang = locale === 'it' ? 'it-IT' : 'en-US'

  const context = await browser.newContext({
    viewport: VIEWPORTS[device],
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    locale: navigatorLang,
  })

  await context.addInitScript(`
    Object.defineProperty(navigator, 'language', {
      get: () => '${navigatorLang}',
      configurable: true,
    })
    window.__TAURI_INTERNALS__ = {
      invoke: () => Promise.reject(new Error('no backend')),
      transformCallback: () => 0,
      convertFileSrc: src => src,
    }
  `)

  const page = await context.newPage()
  await page.goto(`${BASE_URL}/#${route}`)
  await page.waitForSelector('.v-application', { state: 'visible' })
  await page.waitForTimeout(500)

  if (actions) await actions(page)

  await page.screenshot({ path: path.join(OUT_DIR, file), animations: 'disabled' })
  console.log(`  ✓ ${file}`)
  await context.close()
}

async function main() {
  try {
    await fetch(BASE_URL)
  } catch {
    console.error(`Dev server non raggiungibile su ${BASE_URL}`)
    console.error('Avvia prima: npm run dev')
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })

  console.log(`Generazione di ${SCENES.length} screenshot...`)
  for (const scene of SCENES) {
    await captureScene(browser, scene)
  }

  await browser.close()
  console.log(`\n${SCENES.length} screenshot salvati in docs/screenshots/`)
}

main().catch(e => { console.error(e); process.exit(1) })
