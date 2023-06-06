<template><div><h1 id="class-bindableannotationcontext-t-x" tabindex="-1"><a class="header-anchor" href="#class-bindableannotationcontext-t-x" aria-hidden="true">#</a> Class: BindableAnnotationContext&lt;T, X&gt;</h1>
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
<td style="text-align:left"><code v-pre>T</code></td>
<td style="text-align:left">extends <RouterLink to="/api/enums/TargetType.html"><code v-pre>TargetType</code></RouterLink> = <RouterLink to="/api/enums/TargetType.html"><code v-pre>TargetType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>X</code></td>
<td style="text-align:left"><code v-pre>unknown</code></td>
</tr>
</tbody>
</table>
<h2 id="hierarchy" tabindex="-1"><a class="header-anchor" href="#hierarchy" aria-hidden="true">#</a> Hierarchy</h2>
<ul>
<li>
<p><RouterLink to="/api/classes/AnnotationContext.html"><code v-pre>AnnotationContext</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;</p>
<p>↳ <strong><code v-pre>BindableAnnotationContext</code></strong></p>
</li>
</ul>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#args">args</RouterLink></li>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#ref">ref</RouterLink></li>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#target">target</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#bind">bind</RouterLink></li>
<li><RouterLink to="/api/classes/BindableAnnotationContext.html#tostring">toString</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new BindableAnnotationContext</strong>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;(<code v-pre>ref</code>, <code v-pre>args</code>, <code v-pre>target</code>)</p>
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
<td style="text-align:left"><code v-pre>T</code></td>
<td style="text-align:left">extends <RouterLink to="/api/enums/TargetType.html"><code v-pre>TargetType</code></RouterLink> = <RouterLink to="/api/enums/TargetType.html"><code v-pre>TargetType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>X</code></td>
<td style="text-align:left"><code v-pre>unknown</code></td>
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
<td style="text-align:left"><code v-pre>ref</code></td>
<td style="text-align:left"><RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink> | <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>args</code></td>
<td style="text-align:left"><code v-pre>any</code>[]</td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>target</code></td>
<td style="text-align:left"><RouterLink to="/api/modules.html#annotationtarget"><code v-pre>AnnotationTarget</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="inherited-from" tabindex="-1"><a class="header-anchor" href="#inherited-from" aria-hidden="true">#</a> Inherited from</h4>
<p><RouterLink to="/api/classes/AnnotationContext.html">AnnotationContext</RouterLink>.<RouterLink to="/api/classes/AnnotationContext.html#constructor">constructor</RouterLink></p>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L8" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:8<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="args" tabindex="-1"><a class="header-anchor" href="#args" aria-hidden="true">#</a> args</h3>
<p>• <code v-pre>Readonly</code> <strong>args</strong>: <code v-pre>any</code>[]</p>
<h4 id="inherited-from-1" tabindex="-1"><a class="header-anchor" href="#inherited-from-1" aria-hidden="true">#</a> Inherited from</h4>
<p><RouterLink to="/api/classes/AnnotationContext.html">AnnotationContext</RouterLink>.<RouterLink to="/api/classes/AnnotationContext.html#args">args</RouterLink></p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L10" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:10<ExternalLinkIcon/></a></p>
<hr>
<h3 id="ref" tabindex="-1"><a class="header-anchor" href="#ref" aria-hidden="true">#</a> ref</h3>
<p>• <code v-pre>Readonly</code> <strong>ref</strong>: <RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink></p>
<h4 id="inherited-from-2" tabindex="-1"><a class="header-anchor" href="#inherited-from-2" aria-hidden="true">#</a> Inherited from</h4>
<p><RouterLink to="/api/classes/AnnotationContext.html">AnnotationContext</RouterLink>.<RouterLink to="/api/classes/AnnotationContext.html#ref">ref</RouterLink></p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L7" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:7<ExternalLinkIcon/></a></p>
<hr>
<h3 id="target" tabindex="-1"><a class="header-anchor" href="#target" aria-hidden="true">#</a> target</h3>
<p>• <code v-pre>Readonly</code> <strong>target</strong>: <RouterLink to="/api/modules.html#annotationtarget"><code v-pre>AnnotationTarget</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;</p>
<h4 id="inherited-from-3" tabindex="-1"><a class="header-anchor" href="#inherited-from-3" aria-hidden="true">#</a> Inherited from</h4>
<p><RouterLink to="/api/classes/AnnotationContext.html">AnnotationContext</RouterLink>.<RouterLink to="/api/classes/AnnotationContext.html#target">target</RouterLink></p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L11" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:11<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="bind" tabindex="-1"><a class="header-anchor" href="#bind" aria-hidden="true">#</a> bind</h3>
<p>▸ <strong>bind</strong>(<code v-pre>instance</code>, <code v-pre>args?</code>): <RouterLink to="/api/classes/BoundAnnotationContext.html"><code v-pre>BoundAnnotationContext</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;</p>
<h4 id="parameters-1" tabindex="-1"><a class="header-anchor" href="#parameters-1" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>instance</code></td>
<td style="text-align:left"><code v-pre>X</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>args?</code></td>
<td style="text-align:left"><code v-pre>T</code> extends <RouterLink to="/api/enums/TargetType.html#parameter"><code v-pre>PARAMETER</code></RouterLink> ? <code v-pre>unknown</code>[] : <code v-pre>never</code></td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/classes/BoundAnnotationContext.html"><code v-pre>BoundAnnotationContext</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;</p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L25" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:25<ExternalLinkIcon/></a></p>
<hr>
<h3 id="tostring" tabindex="-1"><a class="header-anchor" href="#tostring" aria-hidden="true">#</a> toString</h3>
<p>▸ <strong>toString</strong>(): <code v-pre>string</code></p>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>string</code></p>
<h4 id="inherited-from-4" tabindex="-1"><a class="header-anchor" href="#inherited-from-4" aria-hidden="true">#</a> Inherited from</h4>
<p><RouterLink to="/api/classes/AnnotationContext.html">AnnotationContext</RouterLink>.<RouterLink to="/api/classes/AnnotationContext.html#tostring">toString</RouterLink></p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/annotation-context.ts#L16" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/annotation-context.ts:16<ExternalLinkIcon/></a></p>
</div></template>


