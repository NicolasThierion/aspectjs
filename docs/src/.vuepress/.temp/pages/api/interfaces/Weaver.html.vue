<template><div><h1 id="interface-weaver" tabindex="-1"><a class="header-anchor" href="#interface-weaver" aria-hidden="true">#</a> Interface: Weaver</h1>
<p>A Weaver is some sort of processor that invoke the advices according to the enabled aspects</p>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/interfaces/Weaver.html#enable">enable</RouterLink></li>
<li><RouterLink to="/api/interfaces/Weaver.html#getaspects">getAspects</RouterLink></li>
</ul>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="enable" tabindex="-1"><a class="header-anchor" href="#enable" aria-hidden="true">#</a> enable</h3>
<p>▸ <strong>enable</strong>(<code v-pre>...aspects</code>): <RouterLink to="/api/interfaces/Weaver.html"><code v-pre>Weaver</code></RouterLink></p>
<p>Enable some aspects.</p>
<h4 id="parameters" tabindex="-1"><a class="header-anchor" href="#parameters" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
<th style="text-align:left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>...aspects</code></td>
<td style="text-align:left"><code v-pre>object</code>[]</td>
<td style="text-align:left">the aspects to enable</td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/interfaces/Weaver.html"><code v-pre>Weaver</code></RouterLink></p>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/weaver/weaver.ts#L12" target="_blank" rel="noopener noreferrer">packages/core/src/weaver/weaver.ts:12<ExternalLinkIcon/></a></p>
<hr>
<h3 id="getaspects" tabindex="-1"><a class="header-anchor" href="#getaspects" aria-hidden="true">#</a> getAspects</h3>
<p>▸ <strong>getAspects</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>aspect?</code>): <code v-pre>object</code>[]</p>
<p>Find aspects among enabled aspects given an aspect id or constructor.</p>
<h4 id="type-parameters" tabindex="-1"><a class="header-anchor" href="#type-parameters" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
<td style="text-align:left"><code v-pre>object</code></td>
</tr>
</tbody>
</table>
<h4 id="parameters-1" tabindex="-1"><a class="header-anchor" href="#parameters-1" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
<th style="text-align:left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>aspect?</code></td>
<td style="text-align:left"><code v-pre>string</code> | () =&gt; <code v-pre>T</code></td>
<td style="text-align:left">The aspect id or constructor to find.</td>
</tr>
</tbody>
</table>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>object</code>[]</p>
<p>The aspects maching the given id, or an empty array if no aspects found. Returns all aspects if no parameter given.</p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/weaver/weaver.ts#L19" target="_blank" rel="noopener noreferrer">packages/core/src/weaver/weaver.ts:19<ExternalLinkIcon/></a></p>
</div></template>


