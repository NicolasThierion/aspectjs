<template><div><h1 id="class-decoratortargetargs-t-x" tabindex="-1"><a class="header-anchor" href="#class-decoratortargetargs-t-x" aria-hidden="true">#</a> Class: DecoratorTargetArgs&lt;T, X&gt;</h1>
<p>Represents ts decorator arguments, used for creating the <RouterLink to="/api/modules.html#annotationtarget">AnnotationTarget</RouterLink></p>
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
<h2 id="implements" tabindex="-1"><a class="header-anchor" href="#implements" aria-hidden="true">#</a> Implements</h2>
<ul>
<li><RouterLink to="/api/interfaces/DecoratorLocation.html"><code v-pre>DecoratorLocation</code></RouterLink></li>
</ul>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#descriptor">descriptor</RouterLink></li>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#parameterindex">parameterIndex</RouterLink></li>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#propertykey">propertyKey</RouterLink></li>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#proto">proto</RouterLink></li>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#type">type</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/DecoratorTargetArgs.html#of">of</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new DecoratorTargetArgs</strong>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;()</p>
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
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="descriptor" tabindex="-1"><a class="header-anchor" href="#descriptor" aria-hidden="true">#</a> descriptor</h3>
<p>• <code v-pre>Optional</code> <code v-pre>Readonly</code> <strong>descriptor</strong>: <code v-pre>PropertyDescriptor</code></p>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L29" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:29<ExternalLinkIcon/></a></p>
<hr>
<h3 id="parameterindex" tabindex="-1"><a class="header-anchor" href="#parameterindex" aria-hidden="true">#</a> parameterIndex</h3>
<p>• <code v-pre>Optional</code> <code v-pre>Readonly</code> <strong>parameterIndex</strong>: <code v-pre>number</code></p>
<h4 id="implementation-of" tabindex="-1"><a class="header-anchor" href="#implementation-of" aria-hidden="true">#</a> Implementation of</h4>
<p><RouterLink to="/api/interfaces/DecoratorLocation.html">DecoratorLocation</RouterLink>.<RouterLink to="/api/interfaces/DecoratorLocation.html#parameterindex">parameterIndex</RouterLink></p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L28" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:28<ExternalLinkIcon/></a></p>
<hr>
<h3 id="propertykey" tabindex="-1"><a class="header-anchor" href="#propertykey" aria-hidden="true">#</a> propertyKey</h3>
<p>• <code v-pre>Optional</code> <code v-pre>Readonly</code> <strong>propertyKey</strong>: <code v-pre>string</code></p>
<h4 id="implementation-of-1" tabindex="-1"><a class="header-anchor" href="#implementation-of-1" aria-hidden="true">#</a> Implementation of</h4>
<p><RouterLink to="/api/interfaces/DecoratorLocation.html">DecoratorLocation</RouterLink>.<RouterLink to="/api/interfaces/DecoratorLocation.html#propertykey">propertyKey</RouterLink></p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L27" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:27<ExternalLinkIcon/></a></p>
<hr>
<h3 id="proto" tabindex="-1"><a class="header-anchor" href="#proto" aria-hidden="true">#</a> proto</h3>
<p>• <code v-pre>Readonly</code> <strong>proto</strong>: <RouterLink to="/api/modules.html#prototype"><code v-pre>Prototype</code></RouterLink>&lt;<code v-pre>X</code>&gt;</p>
<h4 id="implementation-of-2" tabindex="-1"><a class="header-anchor" href="#implementation-of-2" aria-hidden="true">#</a> Implementation of</h4>
<p><RouterLink to="/api/interfaces/DecoratorLocation.html">DecoratorLocation</RouterLink>.<RouterLink to="/api/interfaces/DecoratorLocation.html#proto">proto</RouterLink></p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L25" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:25<ExternalLinkIcon/></a></p>
<hr>
<h3 id="type" tabindex="-1"><a class="header-anchor" href="#type" aria-hidden="true">#</a> type</h3>
<p>• <code v-pre>Readonly</code> <strong>type</strong>: <code v-pre>T</code></p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L26" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:26<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="of" tabindex="-1"><a class="header-anchor" href="#of" aria-hidden="true">#</a> of</h3>
<p>▸ <code v-pre>Static</code> <strong>of</strong>&lt;<code v-pre>T</code>&gt;(<code v-pre>decoratorArgs</code>): <RouterLink to="/api/classes/DecoratorTargetArgs.html"><code v-pre>DecoratorTargetArgs</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>unknown</code>&gt;</p>
<h4 id="type-parameters-2" tabindex="-1"><a class="header-anchor" href="#type-parameters-2" aria-hidden="true">#</a> Type parameters</h4>
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
<td style="text-align:left"><code v-pre>decoratorArgs</code></td>
<td style="text-align:left"><code v-pre>any</code>[]</td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/classes/DecoratorTargetArgs.html"><code v-pre>DecoratorTargetArgs</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>unknown</code>&gt;</p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/target/target-args.ts#L31" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/target/target-args.ts:31<ExternalLinkIcon/></a></p>
</div></template>


