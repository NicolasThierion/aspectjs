export const data = JSON.parse("{\"key\":\"v-26243d41\",\"path\":\"/demo/0.demo-1.html\",\"title\":\"Demo 1\",\"lang\":\"en-US\",\"frontmatter\":{\"icon\":\"config\",\"category\":[\"Guide\"],\"tag\":[\"disable\"],\"description\":\"demo-1\"},\"headers\":[],\"readingTime\":{\"minutes\":0.03,\"words\":10},\"filePathRelative\":\"demo/0.demo-1.md\",\"autoDesc\":true}")

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
