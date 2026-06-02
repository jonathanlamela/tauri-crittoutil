<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

const features = computed(() => [
  { icon: 'mdi-swap-horizontal', title: t('nav.converter'),    description: t('home.converterDesc'),    to: '/converter' },
  { icon: 'mdi-key',             title: t('nav.keyGenerator'), description: t('home.keyGeneratorDesc'), to: '/key-generator' },
  { icon: 'mdi-lock',            title: t('nav.encrypter'),    description: t('home.encrypterDesc'),    to: '/encrypter' },
  { icon: 'mdi-lock-open',       title: t('nav.decrypter'),    description: t('home.decrypterDesc'),    to: '/decrypter' },
])
</script>

<template>
  <div>
    <div class="d-flex align-center mb-8">
      <v-icon size="40" color="primary" class="mr-3">mdi-shield-lock</v-icon>
      <h1 class="text-h4 font-weight-bold">{{ t('home.title') }}</h1>
    </div>

    <v-row>
      <v-col v-for="f in features" :key="f.to" cols="12" sm="6">
        <v-card
          height="100%"
          rounded="xl"
          elevation="0"
          color="surface-variant"
          @click="router.push(f.to)"
          style="cursor: pointer;"
        >
          <v-card-text class="pa-5">
            <div
              class="d-flex align-center justify-center mb-4"
              style="width:48px; height:48px; border-radius:12px; background: rgb(var(--v-theme-primary-container));"
            >
              <v-icon :icon="f.icon" color="on-primary-container" size="24" />
            </div>
            <div class="text-subtitle-1 font-weight-bold mb-1">{{ f.title }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ f.description }}</div>
          </v-card-text>
          <v-card-actions class="px-5 pb-4">
            <v-spacer />
            <v-btn variant="tonal" color="primary" rounded="xl" :to="f.to">
              {{ t('home.open') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
