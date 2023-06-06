<template><div><h1 id="class-reflectcontext" tabindex="-1"><a class="header-anchor" href="#class-reflectcontext" aria-hidden="true">#</a> Class: ReflectContext</h1>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/ReflectContext.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/ReflectContext.html#addedproviders">addedProviders</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#modules">modules</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#providersregistry">providersRegistry</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#providerstoresolve">providersToResolve</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/ReflectContext.html#get">_get</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#reset">_reset</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#tryresolveprovider">_tryResolveProvider</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#addmodules">addModules</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#get">get</RouterLink></li>
<li><RouterLink to="/api/classes/ReflectContext.html#has">has</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new ReflectContext</strong>(<code v-pre>context?</code>)</p>
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
<td style="text-align:left"><code v-pre>context?</code></td>
<td style="text-align:left"><RouterLink to="/api/classes/ReflectContext.html"><code v-pre>ReflectContext</code></RouterLink></td>
</tr>
</tbody>
</table>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L20" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:20<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="addedproviders" tabindex="-1"><a class="header-anchor" href="#addedproviders" aria-hidden="true">#</a> addedProviders</h3>
<p>• <code v-pre>Private</code> <strong>addedProviders</strong>: <code v-pre>Set</code>&lt;<RouterLink to="/api/modules.html#reflectprovider"><code v-pre>ReflectProvider</code></RouterLink>&gt;</p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L18" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:18<ExternalLinkIcon/></a></p>
<hr>
<h3 id="modules" tabindex="-1"><a class="header-anchor" href="#modules" aria-hidden="true">#</a> modules</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>modules</strong>: <code v-pre>Set</code>&lt;<RouterLink to="/api/interfaces/ReflectModule.html"><code v-pre>ReflectModule</code></RouterLink>&gt;</p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L17" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:17<ExternalLinkIcon/></a></p>
<hr>
<h3 id="providersregistry" tabindex="-1"><a class="header-anchor" href="#providersregistry" aria-hidden="true">#</a> providersRegistry</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>providersRegistry</strong>: <code v-pre>Map</code>&lt;<code v-pre>string</code>, <code v-pre>unknown</code>&gt;</p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L16" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:16<ExternalLinkIcon/></a></p>
<hr>
<h3 id="providerstoresolve" tabindex="-1"><a class="header-anchor" href="#providerstoresolve" aria-hidden="true">#</a> providersToResolve</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>providersToResolve</strong>: <code v-pre>Map</code>&lt;<code v-pre>string</code> | <RouterLink to="/api/modules.html#reflectprovidertype"><code v-pre>ReflectProviderType</code></RouterLink>&lt;<code v-pre>unknown</code>&gt;, <RouterLink to="/api/modules.html#reflectprovider"><code v-pre>ReflectProvider</code></RouterLink>[]&gt;</p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L11" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:11<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="get" tabindex="-1"><a class="header-anchor" href="#get" aria-hidden="true">#</a> _get</h3>
<p>▸ <code v-pre>Private</code> <strong>_get</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>providerName</code>, <code v-pre>neededBy?</code>, <code v-pre>resolveFirst?</code>): <code v-pre>T</code></p>
<h4 id="type-parameters" tabindex="-1"><a class="header-anchor" href="#type-parameters" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
</tbody>
</table>
<h4 id="parameters-1" tabindex="-1"><a class="header-anchor" href="#parameters-1" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
<th style="text-align:left">Default value</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>providerName</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
<td style="text-align:left"><code v-pre>undefined</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>neededBy</code></td>
<td style="text-align:left"><code v-pre>string</code>[]</td>
<td style="text-align:left"><code v-pre>[]</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>resolveFirst</code></td>
<td style="text-align:left"><code v-pre>boolean</code></td>
<td style="text-align:left"><code v-pre>false</code></td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>T</code></p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L51" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:51<ExternalLinkIcon/></a></p>
<hr>
<h3 id="reset" tabindex="-1"><a class="header-anchor" href="#reset" aria-hidden="true">#</a> _reset</h3>
<p>▸ <code v-pre>Protected</code> <strong>_reset</strong>(): <code v-pre>void</code></p>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>void</code></p>
<h4 id="defined-in-6" tabindex="-1"><a class="header-anchor" href="#defined-in-6" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L76" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:76<ExternalLinkIcon/></a></p>
<hr>
<h3 id="tryresolveprovider" tabindex="-1"><a class="header-anchor" href="#tryresolveprovider" aria-hidden="true">#</a> _tryResolveProvider</h3>
<p>▸ <code v-pre>Private</code> <strong>_tryResolveProvider</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>providerType</code>, <code v-pre>neededBy?</code>, <code v-pre>resolveFirst?</code>): <code v-pre>T</code></p>
<h4 id="type-parameters-1" tabindex="-1"><a class="header-anchor" href="#type-parameters-1" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
</tbody>
</table>
<h4 id="parameters-2" tabindex="-1"><a class="header-anchor" href="#parameters-2" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
<th style="text-align:left">Default value</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>providerType</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
<td style="text-align:left"><code v-pre>undefined</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>neededBy</code></td>
<td style="text-align:left"><code v-pre>string</code>[]</td>
<td style="text-align:left"><code v-pre>[]</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>resolveFirst</code></td>
<td style="text-align:left"><code v-pre>boolean</code></td>
<td style="text-align:left"><code v-pre>false</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-2" tabindex="-1"><a class="header-anchor" href="#returns-2" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>T</code></p>
<h4 id="defined-in-7" tabindex="-1"><a class="header-anchor" href="#defined-in-7" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L83" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:83<ExternalLinkIcon/></a></p>
<hr>
<h3 id="addmodules" tabindex="-1"><a class="header-anchor" href="#addmodules" aria-hidden="true">#</a> addModules</h3>
<p>▸ <strong>addModules</strong>(<code v-pre>...modules</code>): <RouterLink to="/api/classes/ReflectContext.html"><code v-pre>ReflectContext</code></RouterLink></p>
<h4 id="parameters-3" tabindex="-1"><a class="header-anchor" href="#parameters-3" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>...modules</code></td>
<td style="text-align:left"><RouterLink to="/api/interfaces/ReflectModule.html"><code v-pre>ReflectModule</code></RouterLink>[]</td>
</tr>
</tbody>
</table>
<h4 id="returns-3" tabindex="-1"><a class="header-anchor" href="#returns-3" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/classes/ReflectContext.html"><code v-pre>ReflectContext</code></RouterLink></p>
<h4 id="defined-in-8" tabindex="-1"><a class="header-anchor" href="#defined-in-8" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L26" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:26<ExternalLinkIcon/></a></p>
<hr>
<h3 id="get-1" tabindex="-1"><a class="header-anchor" href="#get-1" aria-hidden="true">#</a> get</h3>
<p>▸ <strong>get</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>providerType</code>): <code v-pre>T</code></p>
<h4 id="type-parameters-2" tabindex="-1"><a class="header-anchor" href="#type-parameters-2" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
</tbody>
</table>
<h4 id="parameters-4" tabindex="-1"><a class="header-anchor" href="#parameters-4" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>providerType</code></td>
<td style="text-align:left"><code v-pre>string</code> | <RouterLink to="/api/modules.html#reflectprovidertype"><code v-pre>ReflectProviderType</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="returns-4" tabindex="-1"><a class="header-anchor" href="#returns-4" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>T</code></p>
<h4 id="defined-in-9" tabindex="-1"><a class="header-anchor" href="#defined-in-9" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L47" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:47<ExternalLinkIcon/></a></p>
<hr>
<h3 id="has" tabindex="-1"><a class="header-anchor" href="#has" aria-hidden="true">#</a> has</h3>
<p>▸ <strong>has</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>providerType</code>): <code v-pre>boolean</code></p>
<h4 id="type-parameters-3" tabindex="-1"><a class="header-anchor" href="#type-parameters-3" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
</tbody>
</table>
<h4 id="parameters-5" tabindex="-1"><a class="header-anchor" href="#parameters-5" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>providerType</code></td>
<td style="text-align:left"><code v-pre>string</code> | <RouterLink to="/api/modules.html#reflectprovidertype"><code v-pre>ReflectProviderType</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="returns-5" tabindex="-1"><a class="header-anchor" href="#returns-5" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>boolean</code></p>
<h4 id="defined-in-10" tabindex="-1"><a class="header-anchor" href="#defined-in-10" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/reflect/reflect.context.ts#L72" target="_blank" rel="noopener noreferrer">packages/common/src/reflect/reflect.context.ts:72<ExternalLinkIcon/></a></p>
</div></template>


