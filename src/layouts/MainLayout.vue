<script setup lang="ts">
const menuLinks = [
  {
    title: 'Home',
    icon: 'home',
    to: '/',
  },
  {
    title: 'Editor',
    icon: 'edit_document',
    to: '/editor',
  },
  {
    title: 'Migration Preview',
    icon: 'menu_book',
    to: '/migration-preview/AU/eng/basics/basics00',
  },
];
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="app-header">
      <q-toolbar class="app-toolbar">
        <q-btn flat dense round icon="menu" aria-label="Menu" class="menu-button">
          <q-menu anchor="bottom left" self="top left" :offset="[0, 10]" class="app-menu">
            <q-list padding style="min-width: 220px">
              <q-item
                v-for="link in menuLinks"
                :key="link.to"
                clickable
                :to="link.to"
                exact
                v-close-popup
                class="app-menu__item"
              >
                <q-item-section avatar>
                  <q-icon :name="link.icon" class="app-menu__icon" />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ link.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-toolbar-title class="app-title"> TrailWright </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.app-header {
  background: linear-gradient(180deg, #2f7ac6 0%, #256fb7 100%);
}

.app-toolbar {
  min-height: 64px;
  padding: 0 12px;
}

.menu-button {
  color: #ffffff;
}

.app-title {
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.app-menu {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #dcc8ae;
  box-shadow: 0 12px 28px rgba(77, 52, 30, 0.14);
  background: #fffdf9;
}

.app-menu__item {
  min-height: 52px;
  color: #3a2a1d;
}

.app-menu__item:hover {
  background: #f8efe2;
}

.app-menu__icon {
  color: #8a4b14;
}
</style>
