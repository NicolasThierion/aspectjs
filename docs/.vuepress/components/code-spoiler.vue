<template>
    <div class="theme-code-group">
        <div class="theme-code-group__nav" @click="expand()">
            <ul class="theme-code-group__ul">
                <li
                        v-for="(tab, i) in codeTabs"
                        :key="tab.title"
                        class="theme-code-group__li"
                >
                    <button
                            class="theme-code-group__nav-tab"
                            :class="{
              'theme-code-group__nav-tab-active': i === activeCodeTabIndex,
            }"
                            @click.stop="changeCodeTab(i)"
                    >
                        {{ tab.title }}
                    </button>
                </li>
            </ul>
        </div>
        <div class="theme-code-group__body">
            <slot />
        </div>
        <pre
                v-if="codeTabs.length < 1"
                class="pre-blank"
        >// Make sure to add code blocks to your code group</pre>
    </div>
</template>

<script>
    export default {
        name: 'CodeSpoiler',
        data () {
            return {
                codeTabs: [],
                activeCodeTabIndex: -1,
                collapsed: true
            }
        },
        watch: {
            activeCodeTabIndex (index) {
                this.codeTabs.forEach(tab => {
                    tab.elm.classList.remove('theme-code-block__active')
                });
                this.codeTabs[index].elm.classList.add('theme-code-block__active')
            }
        },
        mounted () {
            setTimeout(() => {

                this.codeTabs = (this.$slots.default || [])
                    .filter(slot => Boolean(slot.componentOptions))
                    .map((slot, index) => {
                        if (slot.componentOptions.propsData.active === '') {
                            this.activeCodeTabIndex = index
                        }
                        return {
                            title: slot.componentOptions.propsData.title,
                            elm: slot.elm
                        }
                    });

                if (this.activeCodeTabIndex === -1 && this.codeTabs.length > 0) {
                    this.activeCodeTabIndex = 0
                }
            });
        },
        methods: {
            changeCodeTab (index) {
                if (this.activeCodeTabIndex === index && !this.collapsed) {
                    this.collapse()
                } else if (this.collapsed) {
                    this.expand()
                }

                this.activeCodeTabIndex = index;
            },

            collapse(options) { return this.slideToggle(false, options); },
            expand(options) { return this.slideToggle( true, options); },
            slideToggle(isOpening, options = {}) {
                options.duration = options.duration || 300;

                if (isOpening === !this.collapsed) {
                    return
                }
                this.collapsed = !isOpening;

                const element = this.$el.querySelector('.theme-code-group__body');

                let h0 = this.getHeight(element);
                let duration = (options && options.duration) || 1000;
                let start = null;
                if (!this.collapsed) {
                    this.$el.querySelector('.theme-code-group__nav').classList.toggle('expanded', true);
                }
                const step = (timestamp) => {
                    if (!start) { start = timestamp; }
                    let progress = 1.0 * (timestamp - start) / duration;
                    let h1 = isOpening ? (h0 * progress) : (h0 * (1 - progress));
                    if (progress < 1.0) {
                        element.style.height = h1 + 'px';
                        if (options.progress) { options.progress(); }
                        window.requestAnimationFrame(step);
                    } else {
                        element.style.height = '';
                        element.style.overflow = '';
                        if (!isOpening) { element.style.display = 'none'; }

                        // if (scrollFunc) { scrollFunc(); }

                        if (this.collapsed) {
                            this.$el.querySelector('.theme-code-group__nav').classList.toggle('expanded', false);
                        }
                    }
                };

                element.style.display = 'block';
                element.style.overflow = 'hidden';
                window.requestAnimationFrame(step);

                return true;
            },

            // https://stackoverflow.com/a/29047232/3423843
            getHeight(el) {
                let el_comp_style = window.getComputedStyle(el),
                    el_display    = el_comp_style.display,
                    el_max_height = el_comp_style.maxHeight.replace('px', '').replace('%', ''),
                    el_position   = el.style.position,
                    el_visibility = el.style.visibility,
                    wanted_height = 0;

                if (el_display !== 'none' && el_max_height !== '0') {
                    return el.offsetHeight;
                }

                el.style.position   = 'absolute';
                el.style.visibility = 'hidden';
                el.style.display    = 'block';

                wanted_height = el.offsetHeight;

                el.style.display    = el_display;
                el.style.position   = el_position;
                el.style.visibility = el_visibility;

                return wanted_height;
            }
        }
    }
</script>

<style lang="stylus" scoped>
    .theme-code-group {}
    .theme-code-group__nav {
        background-color: $codeBgColor;
        padding-bottom: 22px;
        border-radius: 6px;

        padding-left: 10px;
        padding-top: 10px;
        &.expanded {
            margin-bottom: -35px;
        }
    }

    .theme-code-group__ul {
        margin: auto 0;
        padding-left: 0;
        display: inline-flex;
        list-style: none;
    }
    .theme-code-group__li {}
    .theme-code-group__nav-tab {
        border: 0;
        padding: 5px;
        cursor: pointer;
        background-color: transparent;
        font-size: 0.85em;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 600;
    }
    .theme-code-group__nav-tab-active {
        border-bottom: #42b983 1px solid;
    }
    .pre-blank {
        color: #42b983;
    }

    .spoiler {
    }
    .spoiler-btn:hover {
        cursor: pointer;
        color: $accentColor;
    }
    .spoiler-btn-bottom {
        width: 100%;
        text-align: right;
    }
    .theme-code-group__body {
        display: none;
    }
    #content {
        max-height: 640px;
        width: 100%;
        max-width: 570px;
        margin: 0 auto;
    }
</style>
