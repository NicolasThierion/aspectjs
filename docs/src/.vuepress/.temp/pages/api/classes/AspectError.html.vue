<template><div><h1 id="class-aspecterror" tabindex="-1"><a class="header-anchor" href="#class-aspecterror" aria-hidden="true">#</a> Class: AspectError</h1>
<h2 id="hierarchy" tabindex="-1"><a class="header-anchor" href="#hierarchy" aria-hidden="true">#</a> Hierarchy</h2>
<ul>
<li>
<p><code v-pre>Error</code></p>
<p>↳ <strong><code v-pre>AspectError</code></strong></p>
<p>↳↳ <RouterLink to="/api/classes/AdviceError.html"><code v-pre>AdviceError</code></RouterLink></p>
<p>↳↳ <RouterLink to="/api/classes/WeavingError.html"><code v-pre>WeavingError</code></RouterLink></p>
</li>
</ul>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/AspectError.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/AspectError.html#message">message</RouterLink></li>
<li><RouterLink to="/api/classes/AspectError.html#name">name</RouterLink></li>
<li><RouterLink to="/api/classes/AspectError.html#stack">stack</RouterLink></li>
<li><RouterLink to="/api/classes/AspectError.html#preparestacktrace">prepareStackTrace</RouterLink></li>
<li><RouterLink to="/api/classes/AspectError.html#stacktracelimit">stackTraceLimit</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/AspectError.html#capturestacktrace">captureStackTrace</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new AspectError</strong>(<code v-pre>msg</code>)</p>
<h4 id="parameters" tabindex="-1"><a class="header-anchor" href="#parameters" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>msg</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
</tbody>
</table>
<h4 id="overrides" tabindex="-1"><a class="header-anchor" href="#overrides" aria-hidden="true">#</a> Overrides</h4>
<p>Error.constructor</p>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/errors/aspect.error.ts#L2" target="_blank" rel="noopener noreferrer">packages/core/src/errors/aspect.error.ts:2<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="message" tabindex="-1"><a class="header-anchor" href="#message" aria-hidden="true">#</a> message</h3>
<p>• <strong>message</strong>: <code v-pre>string</code></p>
<h4 id="inherited-from" tabindex="-1"><a class="header-anchor" href="#inherited-from" aria-hidden="true">#</a> Inherited from</h4>
<p>Error.message</p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/typescript/lib/lib.es5.d.ts:1055</p>
<hr>
<h3 id="name" tabindex="-1"><a class="header-anchor" href="#name" aria-hidden="true">#</a> name</h3>
<p>• <strong>name</strong>: <code v-pre>string</code></p>
<h4 id="inherited-from-1" tabindex="-1"><a class="header-anchor" href="#inherited-from-1" aria-hidden="true">#</a> Inherited from</h4>
<p><a href="http://Error.name" target="_blank" rel="noopener noreferrer">Error.name<ExternalLinkIcon/></a></p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/typescript/lib/lib.es5.d.ts:1054</p>
<hr>
<h3 id="stack" tabindex="-1"><a class="header-anchor" href="#stack" aria-hidden="true">#</a> stack</h3>
<p>• <code v-pre>Optional</code> <strong>stack</strong>: <code v-pre>string</code></p>
<h4 id="inherited-from-2" tabindex="-1"><a class="header-anchor" href="#inherited-from-2" aria-hidden="true">#</a> Inherited from</h4>
<p>Error.stack</p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/typescript/lib/lib.es5.d.ts:1056</p>
<hr>
<h3 id="preparestacktrace" tabindex="-1"><a class="header-anchor" href="#preparestacktrace" aria-hidden="true">#</a> prepareStackTrace</h3>
<p>▪ <code v-pre>Static</code> <code v-pre>Optional</code> <strong>prepareStackTrace</strong>: (<code v-pre>err</code>: <code v-pre>Error</code>, <code v-pre>stackTraces</code>: <code v-pre>CallSite</code>[]) =&gt; <code v-pre>any</code></p>
<h4 id="type-declaration" tabindex="-1"><a class="header-anchor" href="#type-declaration" aria-hidden="true">#</a> Type declaration</h4>
<p>▸ (<code v-pre>err</code>, <code v-pre>stackTraces</code>): <code v-pre>any</code></p>
<p>Optional override for formatting stack traces</p>
<p><strong><code v-pre>See</code></strong></p>
<p><a href="https://v8.dev/docs/stack-trace-api#customizing-stack-traces" target="_blank" rel="noopener noreferrer">https://v8.dev/docs/stack-trace-api#customizing-stack-traces<ExternalLinkIcon/></a></p>
<h5 id="parameters-1" tabindex="-1"><a class="header-anchor" href="#parameters-1" aria-hidden="true">#</a> Parameters</h5>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>err</code></td>
<td style="text-align:left"><code v-pre>Error</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>stackTraces</code></td>
<td style="text-align:left"><code v-pre>CallSite</code>[]</td>
</tr>
</tbody>
</table>
<h5 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h5>
<p><code v-pre>any</code></p>
<h4 id="inherited-from-3" tabindex="-1"><a class="header-anchor" href="#inherited-from-3" aria-hidden="true">#</a> Inherited from</h4>
<p>Error.prepareStackTrace</p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/@types/node/globals.d.ts:11</p>
<hr>
<h3 id="stacktracelimit" tabindex="-1"><a class="header-anchor" href="#stacktracelimit" aria-hidden="true">#</a> stackTraceLimit</h3>
<p>▪ <code v-pre>Static</code> <strong>stackTraceLimit</strong>: <code v-pre>number</code></p>
<h4 id="inherited-from-4" tabindex="-1"><a class="header-anchor" href="#inherited-from-4" aria-hidden="true">#</a> Inherited from</h4>
<p>Error.stackTraceLimit</p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/@types/node/globals.d.ts:13</p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="capturestacktrace" tabindex="-1"><a class="header-anchor" href="#capturestacktrace" aria-hidden="true">#</a> captureStackTrace</h3>
<p>▸ <code v-pre>Static</code> <strong>captureStackTrace</strong>(<code v-pre>targetObject</code>, <code v-pre>constructorOpt?</code>): <code v-pre>void</code></p>
<p>Create .stack property on a target object</p>
<h4 id="parameters-2" tabindex="-1"><a class="header-anchor" href="#parameters-2" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>targetObject</code></td>
<td style="text-align:left"><code v-pre>object</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>constructorOpt?</code></td>
<td style="text-align:left"><code v-pre>Function</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>void</code></p>
<h4 id="inherited-from-5" tabindex="-1"><a class="header-anchor" href="#inherited-from-5" aria-hidden="true">#</a> Inherited from</h4>
<p>Error.captureStackTrace</p>
<h4 id="defined-in-6" tabindex="-1"><a class="header-anchor" href="#defined-in-6" aria-hidden="true">#</a> Defined in</h4>
<p>docs/node_modules/@types/node/globals.d.ts:4</p>
</div></template>


