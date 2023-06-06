<template><div><p>VuePress basically generate pages from Markdown files. So you can use it to generate documentation or blog sites easily.</p>
<p>You should create and write Markdown files, so that VuePress can convert them to different pages according to file structure.</p>
<!-- more -->
<h2 id="markdown-introduction" tabindex="-1"><a class="header-anchor" href="#markdown-introduction" aria-hidden="true">#</a> Markdown Introduction</h2>
<p>If you are a new learner and don't know how to write Markdown, please read <a href="https://theme-hope.vuejs.press/cookbook/markdown/" target="_blank" rel="noopener noreferrer">Markdown Intro<ExternalLinkIcon/></a> and <a href="https://theme-hope.vuejs.press/cookbook/markdown/demo.html" target="_blank" rel="noopener noreferrer">Markdown Demo<ExternalLinkIcon/></a>.</p>
<h2 id="markdown-config" tabindex="-1"><a class="header-anchor" href="#markdown-config" aria-hidden="true">#</a> Markdown Config</h2>
<p>VuePress introduce configuration for each Markdown page using Frontmatter.</p>
<div class="hint-container info">
<p class="hint-container-title">Info</p>
<p>Frontmatter is a important concept in VuePress. If you don't know it, you need to read <a href="https://theme-hope.vuejs.press/cookbook/vuepress/page.html#front-matter" target="_blank" rel="noopener noreferrer">Frontmatter Introduction<ExternalLinkIcon/></a>.</p>
</div>
<h2 id="markdown-extension" tabindex="-1"><a class="header-anchor" href="#markdown-extension" aria-hidden="true">#</a> Markdown Extension</h2>
<p>The Markdown content in VuePress will be parsed by <a href="https://github.com/markdown-it/markdown-it" target="_blank" rel="noopener noreferrer">markdown-it<ExternalLinkIcon/></a>, which supports <a href="https://github.com/markdown-it/markdown-it#syntax-extensions" target="_blank" rel="noopener noreferrer">syntax extensions<ExternalLinkIcon/></a> via markdown-it plugins.</p>
<h3 id="vuepress-enhancement" tabindex="-1"><a class="header-anchor" href="#vuepress-enhancement" aria-hidden="true">#</a> VuePress Enhancement</h3>
<p>To enrich document writing, VuePress has extended Markdown syntax.</p>
<p>For these extensions, please read <a href="https://theme-hope.vuejs.press/basic/vuepress/markdown.html" target="_blank" rel="noopener noreferrer">Markdown extensions in VuePress<ExternalLinkIcon/></a>.</p>
<h3 id="theme-enhancement" tabindex="-1"><a class="header-anchor" href="#theme-enhancement" aria-hidden="true">#</a> Theme Enhancement</h3>
<p>By using <a href="https://theme-hope.vuejs.press/md-enhance/" target="_blank" rel="noopener noreferrer"><code v-pre>vuepress-plugin-md-enhance</code><ExternalLinkIcon/></a>, the theme extends more Markdown syntax and provides richer writing functions.</p>
<h4 id="custom-container" tabindex="-1"><a class="header-anchor" href="#custom-container" aria-hidden="true">#</a> Custom Container</h4>
<div v-pre>
<p>Safely use {{ variable }} in Markdown.</p>
</div>
<div class="hint-container info">
<p class="hint-container-title">Custom Title</p>
<p>A custom information container with <code v-pre>code</code>, <a href="#custom-container">link</a>.</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">const</span> a <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div></div>
<div class="hint-container tip">
<p class="hint-container-title">Custom Title</p>
<p>A custom tip container</p>
</div>
<div class="hint-container warning">
<p class="hint-container-title">Custom Title</p>
<p>A custom warning container</p>
</div>
<div class="hint-container danger">
<p class="hint-container-title">Custom Title</p>
<p>A custom danger container</p>
</div>
<details class="hint-container details"><summary>Custom Title</summary>
<p>A custom details container</p>
</details>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/container.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="tabs" tabindex="-1"><a class="header-anchor" href="#tabs" aria-hidden="true">#</a> Tabs</h4>
<Tabs id="89" :data='[{"title":"apple"},{"title":"banana"},{"title":"orange"}]' tab-id="fruit">
<template #tab0="{ title, value, isActive }">
<p>Apple</p>
</template>
<template #tab1="{ title, value, isActive }">
<p>Banana</p>
</template>
<template #tab2="{ title, value, isActive }">
<p>Orange</p>
</template>
</Tabs>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/tabs.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="code-tabs" tabindex="-1"><a class="header-anchor" href="#code-tabs" aria-hidden="true">#</a> Code Tabs</h4>
<CodeTabs id="116" :data='[{"title":"pnpm"},{"title":"yarn"},{"title":"npm"}]' :active="2" tab-id="shell">
<template #tab0="{ title, value, isActive }">
<div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token function">pnpm</span> <span class="token function">add</span> <span class="token parameter variable">-D</span> vuepress-theme-hope
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div></template>
<template #tab1="{ title, value, isActive }">
<div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token function">yarn</span> <span class="token function">add</span> <span class="token parameter variable">-D</span> vuepress-theme-hope
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div></template>
<template #tab2="{ title, value, isActive }">
<div class="language-bash line-numbers-mode" data-ext="sh"><pre v-pre class="language-bash"><code><span class="token function">npm</span> i <span class="token parameter variable">-D</span> vuepress-theme-hope
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div></template>
</CodeTabs>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/code-tabs.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="superscript-and-subscript" tabindex="-1"><a class="header-anchor" href="#superscript-and-subscript" aria-hidden="true">#</a> Superscript and Subscript</h4>
<p>19<sup>th</sup> H<sub>2</sub>O</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/sup-sub.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="align" tabindex="-1"><a class="header-anchor" href="#align" aria-hidden="true">#</a> Align</h4>
<div style="text-align:center">
<p>I am center</p>
</div>
<div style="text-align:right">
<p>I am right align</p>
</div>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/align.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="attrs" tabindex="-1"><a class="header-anchor" href="#attrs" aria-hidden="true">#</a> Attrs</h4>
<p>A <strong id="word">word</strong> having id.</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/attrs.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="footnote" tabindex="-1"><a class="header-anchor" href="#footnote" aria-hidden="true">#</a> Footnote</h4>
<p>This text has footnote<sup class="footnote-ref"><a href="#footnote1">[1]</a><a class="footnote-anchor" id="footnote-ref1" /></sup>.</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/footnote.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="mark" tabindex="-1"><a class="header-anchor" href="#mark" aria-hidden="true">#</a> Mark</h4>
<p>You can mark <mark>important words</mark> .</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/mark.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="tasklist" tabindex="-1"><a class="header-anchor" href="#tasklist" aria-hidden="true">#</a> Tasklist</h4>
<ul class="task-list-container">
<li class="task-list-item">
<p><input type="checkbox" class="task-list-item-checkbox" id="task-item-0" checked="checked" disabled="disabled"><label class="task-list-item-label" for="task-item-0"> Plan A</label></p>
</li>
<li class="task-list-item">
<p><input type="checkbox" class="task-list-item-checkbox" id="task-item-1" disabled="disabled"><label class="task-list-item-label" for="task-item-1"> Plan B</label></p>
</li>
<li>
<p><a href="https://theme-hope.vuejs.press/guide/markdown/tasklist.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></p>
</li>
</ul>
<h4 id="image-enhancement" tabindex="-1"><a class="header-anchor" href="#image-enhancement" aria-hidden="true">#</a> Image Enhancement</h4>
<p>Support setting color scheme and size</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/image.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="card" tabindex="-1"><a class="header-anchor" href="#card" aria-hidden="true">#</a> Card</h4>
<div class="language-card line-numbers-mode" data-ext="card"><pre v-pre class="language-card"><code>title: Mr.Hope
desc: Where there is light, there is hope
logo: https://mrhope.site/logo.svg
link: https://mrhope.site
color: rgba(253, 230, 138, 0.15)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/card.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="chart" tabindex="-1"><a class="header-anchor" href="#chart" aria-hidden="true">#</a> Chart</h4>
<ChartJS id="chart-253" config="eJxtUEsKgzAQ3XuKIasWrKjFhd22N+iyuIgaRJoa0RQqxbt3Jh+14CYk7zeT9w0AmJ56wS7AxoprLQYWElhzzREkgXuNQo+IPAwCjjGs5KWQlHC3CXCzcpPkNC7Pu00CsA9CpyQOgU14i2FeHQvv2WSfXtzZvjvKPB+hYhEUm91KXj2bQb27+qqkGugnQ1Me0gyteR5Cck6PzMltQoGnmcZUr1vVUTGuKmxRivWNCK2xacvXLdtOcNu2Y3o1tpRGbKm0Vq//qXTOwRz8AH72Yfs=" title="A%20Scatter%20Chart" type="json"></ChartJS><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/chart.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="echarts" tabindex="-1"><a class="header-anchor" href="#echarts" aria-hidden="true">#</a> Echarts</h4>
<ECharts id="echarts-266" config="eJyr5lJQUKpwrMgsVrJSAHGA3JLKglQgTyk5sSQ1Pb+oUkkHIp6SWJIIFI9W8s3PU9JRUAopTQVR4akpYF5GKYhyK8oEUcGJJWCqNE8pFqi7FmSEUiV2e8oSc4AmwVUVpxZlpoKURYOVQRQjWW9oaqCjYGQMIoxMgIShhY6CobEpkDAxB3LNDGIh7kWyISczD2wB0AogGctVywUA9j06jQ==" title="A%20line%20chart"></ECharts><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/echarts.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="flowchart" tabindex="-1"><a class="header-anchor" href="#flowchart" aria-hidden="true">#</a> Flowchart</h4>
<FlowChart id="flowchart-279" code="eJxLzs9LsbUDkZklmfl5VgoBRfnJqcXF9lwFEIatXX5BalEiiiRXqq1dal6KlYJrXgoXF0izRmVqsaauHVSPrl0qRDQvHyiYygUAPWgiyQ==" preset="vue"></FlowChart><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/flowchart.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="mermaid" tabindex="-1"><a class="header-anchor" href="#mermaid" aria-hidden="true">#</a> Mermaid</h4>
<div class="language-mermaid line-numbers-mode" data-ext="mermaid"><pre v-pre class="language-mermaid"><code><span class="token arrow operator">---</span>
title<span class="token operator">:</span> Flowchart
<span class="token arrow operator">---</span>
<span class="token keyword">flowchart</span> TB
    c1<span class="token arrow operator">--></span>a2
    <span class="token keyword">subgraph</span> one
    a1<span class="token arrow operator">--></span>a2
    <span class="token keyword">end</span>
    <span class="token keyword">subgraph</span> two
    b1<span class="token arrow operator">--></span>b2
    <span class="token keyword">end</span>
    <span class="token keyword">subgraph</span> three
    c1<span class="token arrow operator">--></span>c2
    <span class="token keyword">end</span>
    one <span class="token arrow operator">--></span> two
    three <span class="token arrow operator">--></span> two
    two <span class="token arrow operator">--></span> c2
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/mermaid.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="tex" tabindex="-1"><a class="header-anchor" href="#tex" aria-hidden="true">#</a> Tex</h4>
<p>$$
\frac {\partial^r} {\partial \omega^r} \left(\frac {y^{\omega}} {\omega}\right)
= \left(\frac {y^{\omega}} {\omega}\right) \left{(\log y)^r + \sum_{i=1}^r \frac {(-1)^i r \cdots (r-i+1) (\log y)^{r-i}} {\omega^i} \right}
$$</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/tex.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="include-files" tabindex="-1"><a class="header-anchor" href="#include-files" aria-hidden="true">#</a> Include files</h4>
<ul>
<li>
<p><RouterLink to="/demo/markdown.html">Markdown Enhance</RouterLink></p>
</li>
<li>
<p><RouterLink to="/demo/page.html">Page Config</RouterLink></p>
</li>
<li>
<p><RouterLink to="/demo/disable.html">Function Disable</RouterLink></p>
</li>
<li>
<p><RouterLink to="/demo/encrypt.html">Encryption Demo</RouterLink></p>
</li>
</ul>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/include.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="code-demo" tabindex="-1"><a class="header-anchor" href="#code-demo" aria-hidden="true">#</a> Code Demo</h4>

<CodeDemo id="code-demo-348" type="normal" title="A%20normal%20demo" code="eJxFjjELwjAQhf/KGYe0IBZXjdkEBQdBccpSkpNW0yQmqSLif/fi4nIH773v3r1ZlwfLlkx0C3ke8RAxJTh1OCBsfUDRkK6cCHKXQKTQOujNWrEHxpdisizRFFlC8E+Ml9FORBMIYTN2TXTYeD0O6PL8PlL4iBZ19rHi08Lyet4as3mQv+9TRofkaNvrG59BVcNawls5gNZizBU/E/Lv4fVKuU8Z1KVTKfs9+CO0tz4uIaIpIYp8vnLuTsE=">
<div class="language-html line-numbers-mode" data-ext="html"><pre v-pre class="language-html"><code><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>VuePress Theme Hope<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span><span class="token punctuation">></span></span>Is <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>span</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>very<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>very<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>span</span><span class="token punctuation">></span></span> powerful!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code>document<span class="token punctuation">.</span><span class="token function">querySelector</span><span class="token punctuation">(</span><span class="token string">'#very'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">addEventListener</span><span class="token punctuation">(</span><span class="token string">'click'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
  <span class="token function">alert</span><span class="token punctuation">(</span><span class="token string">'Very powerful!'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="language-css line-numbers-mode" data-ext="css"><pre v-pre class="language-css"><code><span class="token selector">span</span> <span class="token punctuation">{</span>
  <span class="token property">color</span><span class="token punctuation">:</span> red<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></CodeDemo><ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/demo.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="stylize" tabindex="-1"><a class="header-anchor" href="#stylize" aria-hidden="true">#</a> Stylize</h4>
<p>Donate Mr.Hope a cup of coffee. <Badge type="tip">Recommended</Badge></p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/stylize.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="playground" tabindex="-1"><a class="header-anchor" href="#playground" aria-hidden="true">#</a> Playground</h4>
<Playground key="499dfb98" title="TS%20demo" link="https%3A%2F%2Fwww.typescriptlang.org%2Fplay%23code%2FMYewdgzgLgBAthA5jAvDA5ACwKYBtcgwDuIATrgCboDcAULaJLBAA7YCGA1qjABQKIAXDGikAlmEQBKVAD4YjCCFzYAdAUT8kUurVYdOW6XSA">
</Playground>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/playground.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="vue-playground" tabindex="-1"><a class="header-anchor" href="#vue-playground" aria-hidden="true">#</a> Vue Playground</h4>
<VuePlayground title="Vue%20Playground" key="2ba7e848" settings="%7B%7D" files="eyJBcHAudnVlIjoiPHNjcmlwdCBzZXR1cD5cbmltcG9ydCB7IHJlZiB9IGZyb20gJ3Z1ZSc7XG5cbmNvbnN0IG1zZyA9IHJlZignSGVsbG8gV29ybGQhJyk7XG48L3NjcmlwdD5cblxuPHRlbXBsYXRlPlxuICA8aDE%2Be3sgbXNnIH19PC9oMT5cbiAgPGlucHV0IHYtbW9kZWw9XCJtc2dcIiAvPlxuPC90ZW1wbGF0ZT5cbiJ9">
</VuePlayground>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/vue-playground.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<h4 id="presentation" tabindex="-1"><a class="header-anchor" href="#presentation" aria-hidden="true">#</a> Presentation</h4>
<p>@slidestart</p>
<h2 id="slide-1" tabindex="-1"><a class="header-anchor" href="#slide-1" aria-hidden="true">#</a> Slide 1</h2>
<p>A paragraph with some text and a <a href="https://mrhope.site" target="_blank" rel="noopener noreferrer">link<ExternalLinkIcon/></a></p>
<hr>
<h2 id="slide-2" tabindex="-1"><a class="header-anchor" href="#slide-2" aria-hidden="true">#</a> Slide 2</h2>
<ul>
<li>Item 1</li>
<li>Item 2</li>
</ul>
<hr>
<h2 id="slide-3-1" tabindex="-1"><a class="header-anchor" href="#slide-3-1" aria-hidden="true">#</a> Slide 3.1</h2>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">const</span> a <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><p>--</p>
<h2 id="slide-3-2" tabindex="-1"><a class="header-anchor" href="#slide-3-2" aria-hidden="true">#</a> Slide 3.2</h2>
<p>$$
J(\theta_0,\theta_1) = \sum_{i=0}
$$</p>
<p>@slideend</p>
<ul>
<li><a href="https://theme-hope.vuejs.press/guide/markdown/presentation.html" target="_blank" rel="noopener noreferrer">View Detail<ExternalLinkIcon/></a></li>
</ul>
<hr class="footnotes-sep">
<section class="footnotes">
<ol class="footnotes-list">
<li id="footnote1" class="footnote-item"><p>This is footnote content <a href="#footnote-ref1" class="footnote-backref">↩︎</a></p>
</li>
</ol>
</section>
</div></template>


