export const data = JSON.parse("{\"key\":\"v-56050e7b\",\"path\":\"/guide/010.bar/00.baz2.html\",\"title\":\"Baz\",\"lang\":\"en-US\",\"frontmatter\":{\"icon\":\"info\",\"description\":\"Feature details here.\"},\"headers\":[],\"readingTime\":{\"minutes\":0.02,\"words\":6},\"filePathRelative\":\"guide/010.bar/00.baz2.md\",\"autoDesc\":true}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
