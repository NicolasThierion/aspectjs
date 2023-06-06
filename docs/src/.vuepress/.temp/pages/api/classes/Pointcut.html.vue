<template><div><h1 id="class-pointcut-p-t" tabindex="-1"><a class="header-anchor" href="#class-pointcut-p-t" aria-hidden="true">#</a> Class: Pointcut&lt;P, T&gt;</h1>
<h2 id="type-parameters" tabindex="-1"><a class="header-anchor" href="#type-parameters" aria-hidden="true">#</a> Type parameters</h2>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>P</code></td>
<td style="text-align:left">extends <RouterLink to="/api/enums/PointcutType.html"><code v-pre>PointcutType</code></RouterLink> = <RouterLink to="/api/enums/PointcutType.html"><code v-pre>PointcutType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
<td style="text-align:left">extends <code v-pre>PointcutTargetType</code> = <code v-pre>PointcutTargetType</code></td>
</tr>
</tbody>
</table>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/Pointcut.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/Pointcut.html#expr">_expr</RouterLink></li>
<li><RouterLink to="/api/classes/Pointcut.html#annotations">annotations</RouterLink></li>
<li><RouterLink to="/api/classes/Pointcut.html#name">name</RouterLink></li>
<li><RouterLink to="/api/classes/Pointcut.html#targettype">targetType</RouterLink></li>
<li><RouterLink to="/api/classes/Pointcut.html#type">type</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/Pointcut.html#toprimitive">[toPrimitive]</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new Pointcut</strong>&lt;<code v-pre>P</code>, <code v-pre>T</code>&gt;(<code v-pre>pointcutInit</code>)</p>
<h4 id="type-parameters-1" tabindex="-1"><a class="header-anchor" href="#type-parameters-1" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>P</code></td>
<td style="text-align:left">extends <RouterLink to="/api/enums/PointcutType.html"><code v-pre>PointcutType</code></RouterLink> = <RouterLink to="/api/enums/PointcutType.html"><code v-pre>PointcutType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>T</code></td>
<td style="text-align:left">extends <code v-pre>PointcutTargetType</code> = <code v-pre>PointcutTargetType</code></td>
</tr>
</tbody>
</table>
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
<td style="text-align:left"><code v-pre>pointcutInit</code></td>
<td style="text-align:left"><code v-pre>PointcutInit</code>&lt;<code v-pre>P</code>, <code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L24" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:24<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="expr" tabindex="-1"><a class="header-anchor" href="#expr" aria-hidden="true">#</a> _expr</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>_expr</strong>: <code v-pre>PointcutExpression</code>&lt;<code v-pre>PointcutTargetType</code>&gt;</p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L22" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:22<ExternalLinkIcon/></a></p>
<hr>
<h3 id="annotations" tabindex="-1"><a class="header-anchor" href="#annotations" aria-hidden="true">#</a> annotations</h3>
<p>• <code v-pre>Readonly</code> <strong>annotations</strong>: <RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink>[]</p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L19" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:19<ExternalLinkIcon/></a></p>
<hr>
<h3 id="name" tabindex="-1"><a class="header-anchor" href="#name" aria-hidden="true">#</a> name</h3>
<p>• <code v-pre>Readonly</code> <strong>name</strong>: <code v-pre>string</code></p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L20" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:20<ExternalLinkIcon/></a></p>
<hr>
<h3 id="targettype" tabindex="-1"><a class="header-anchor" href="#targettype" aria-hidden="true">#</a> targetType</h3>
<p>• <code v-pre>Readonly</code> <strong>targetType</strong>: <code v-pre>T</code></p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L18" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:18<ExternalLinkIcon/></a></p>
<hr>
<h3 id="type" tabindex="-1"><a class="header-anchor" href="#type" aria-hidden="true">#</a> type</h3>
<p>• <code v-pre>Readonly</code> <strong>type</strong>: <RouterLink to="/api/enums/PointcutType.html"><code v-pre>PointcutType</code></RouterLink></p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L21" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:21<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="toprimitive" tabindex="-1"><a class="header-anchor" href="#toprimitive" aria-hidden="true">#</a> [toPrimitive]</h3>
<p>▸ <strong>[toPrimitive]</strong>(): <code v-pre>string</code></p>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>string</code></p>
<h4 id="defined-in-6" tabindex="-1"><a class="header-anchor" href="#defined-in-6" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/pointcut/pointcut.ts#L32" target="_blank" rel="noopener noreferrer">packages/core/src/pointcut/pointcut.ts:32<ExternalLinkIcon/></a></p>
</div></template>


