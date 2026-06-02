<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { t } = useI18n()
const railExpanded = ref(false)

const navItems = computed(() => [
  { title: t('nav.home'), icon: 'mdi-home', iconOutline: 'mdi-home-outline', to: '/' },
  { title: t('nav.converter'), icon: 'mdi-swap-horizontal', iconOutline: 'mdi-swap-horizontal', to: '/converter' },
  { title: t('nav.keyGenerator'), icon: 'mdi-key', iconOutline: 'mdi-key-outline', to: '/key-generator' },
  { title: t('nav.encrypter'), icon: 'mdi-lock', iconOutline: 'mdi-lock-outline', to: '/encrypter' },
  { title: t('nav.decrypter'), icon: 'mdi-lock-open', iconOutline: 'mdi-lock-open-outline', to: '/decrypter' },
])

const selectedIndex = computed(() => {
  const idx = navItems.value.findIndex(item => item.to === route.path)
  return idx >= 0 ? idx : 0
})

const isDark = computed(() => theme.global.current.value.dark)

let mq = null
function onSystemThemeChange(e) { theme.change(e.matches ? 'dark' : 'light') }
onMounted(() => {
  mq = window.matchMedia('(prefers-color-scheme: dark)')
  theme.change(mq.matches ? 'dark' : 'light')
  mq.addEventListener('change', onSystemThemeChange)
})
onUnmounted(() => mq?.removeEventListener('change', onSystemThemeChange))
</script>

<template>
  <v-app>
    <!-- Scrim -->
    <div v-if="railExpanded" class="app-nav__scrim" @click="railExpanded = false" />

    <!-- Custom MD3 Navigation Rail/Drawer -->
    <nav class="app-nav" :class="{ 'app-nav--expanded': railExpanded }">
      <!-- Header -->
      <div class="app-nav__header">
        <button class="nav-icon-btn" @click="railExpanded = !railExpanded">
          <v-icon>{{ railExpanded ? 'mdi-menu-open' : 'mdi-menu' }}</v-icon>
        </button>
        <span v-if="railExpanded" class="app-nav__title">CrittoUtil</span>
      </div>

      <!-- Nav items -->
      <div class="app-nav__items">
        <button v-for="(item, index) in navItems" :key="item.to" class="nav-item"
          :class="{ 'nav-item--active': selectedIndex === index, 'nav-item--rail': !railExpanded }"
          @click="router.push(item.to); railExpanded = false">
          <!-- MD3 pill indicator -->
          <span class="nav-item__indicator">
            <v-icon size="24">{{ selectedIndex === index ? item.icon : item.iconOutline }}</v-icon>
          </span>
          <!-- Expanded: label a destra — Rail: label sotto -->
          <span class="nav-item__label">{{ item.title }}</span>
        </button>
      </div>
    </nav>

    <v-main :style="{
      paddingLeft: '80px',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      overflowY: 'auto',
      height: '100dvh',
      boxSizing: 'border-box',
    }">
      <v-container fluid class="pa-6" style="max-width: 860px;">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-nav {
  display: flex;
  flex-direction: column;
  width: 80px;
  height: 100dvh;
  background: rgb(var(--v-theme-surface));
  border-right: none;
  transition: width 0.25s cubic-bezier(0.2, 0, 0, 1);
  flex-shrink: 0;
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.app-nav--expanded {
  width: 240px;
  z-index: 200;
}

.app-nav__scrim {
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgb(0 0 0 / 0.32);
}

.app-nav__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  height: 64px;
  flex-shrink: 0;
}

.app-nav__title {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  color: rgb(var(--v-theme-on-surface));
}

.app-nav__items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}

/* Plain button reset */
.nav-icon-btn,
.nav-item {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 28px;
  padding: 0 16px 0 0;
  height: 56px;
  width: 100%;
  position: relative;
  color: rgb(var(--v-theme-on-surface-variant));
  transition: color 0.2s;
}

/* Rail mode: stack icon + label vertically */
.nav-item--rail {
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 0;
  height: 72px;
  border-radius: 0;
  background: none !important;
}

.nav-item__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 32px;
  border-radius: 16px;
  flex-shrink: 0;
  transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.nav-item:not(.nav-item--rail):hover .nav-item__indicator {
  background-color: rgb(var(--v-theme-on-surface) / 0.08);
}

.nav-item--rail:hover .nav-item__indicator {
  background-color: rgb(var(--v-theme-on-surface) / 0.08);
}

.nav-item--active .nav-item__indicator,
.nav-item--rail.nav-item--active .nav-item__indicator {
  background-color: rgb(var(--v-theme-secondary-container)) !important;
}

.nav-item--active {
  color: rgb(var(--v-theme-on-secondary-container));
}

.nav-item__label {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 0.006em;
}

/* Rail mode: label smaller, centered below icon */
.nav-item--rail .nav-item__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-align: center;
  line-height: 1;
}

.nav-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 32px;
  border-radius: 16px;
  flex-shrink: 0;
  color: rgb(var(--v-theme-on-surface));
  transition: background-color 0.2s;
}

.nav-icon-btn:hover {
  background-color: rgb(var(--v-theme-on-surface) / 0.08);
}
</style>
