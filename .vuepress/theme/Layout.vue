<script>
    import Layout from "@vuepress/theme-default/layouts/Layout.vue";
    import postscribe from "postscribe";
    export default {
        extends: Layout,
        mounted: function () {
            postscribe('#github-corners', `<script data-href="https://github.com/NicolasThierion/aspectjs" data-target="_blank" src="https://unpkg.com/github-corners/dist/embed.min.js"><\/script>`)

        }
    }
    // import 'https://unpkg.com/github-corners/dist/embed.min.js'
</script>

<template>

    <div
            class="theme-container"
            :class="pageClasses"
            @touchstart="onTouchStart"
            @touchend="onTouchEnd"
    >
        <Navbar
                v-if="shouldShowNavbar"
                @toggle-sidebar="toggleSidebar"
        />
        <div id="github-corners"></div>

        <div
                class="sidebar-mask"
                @click="toggleSidebar(false)"
        />

        <Sidebar
                :items="sidebarItems"
                @toggle-sidebar="toggleSidebar"
        >
            <template #top>
                <slot name="sidebar-top" />
            </template>
            <template #bottom>
                <slot name="sidebar-bottom" />
            </template>
        </Sidebar>

        <Home v-if="$page.frontmatter.home" />

        <Page
                v-else
                :sidebar-items="sidebarItems"
        >
            <template #top>
                <slot name="page-top" />
            </template>
            <template #bottom>
                <slot name="page-bottom" />
            </template>
        </Page>
    </div>
</template>
