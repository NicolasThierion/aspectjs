<template><div><h1 id="interface-afterthrowcontext-t-x" tabindex="-1"><a class="header-anchor" href="#interface-afterthrowcontext-t-x" aria-hidden="true">#</a> Interface: AfterThrowContext&lt;T, X&gt;</h1>
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
<td style="text-align:left">extends <code v-pre>PointcutTargetType</code> = <code v-pre>PointcutTargetType</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>X</code></td>
<td style="text-align:left"><code v-pre>unknown</code></td>
</tr>
</tbody>
</table>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/interfaces/AfterThrowContext.html#annotations">annotations</RouterLink></li>
<li><RouterLink to="/api/interfaces/AfterThrowContext.html#args">args</RouterLink></li>
<li><RouterLink to="/api/interfaces/AfterThrowContext.html#error">error</RouterLink></li>
<li><RouterLink to="/api/interfaces/AfterThrowContext.html#instance">instance</RouterLink></li>
<li><RouterLink to="/api/interfaces/AfterThrowContext.html#target">target</RouterLink></li>
</ul>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="annotations" tabindex="-1"><a class="header-anchor" href="#annotations" aria-hidden="true">#</a> annotations</h3>
<p>• <code v-pre>Readonly</code> <strong>annotations</strong>: <RouterLink to="/api/classes/AnnotationContext.html"><code v-pre>AnnotationContext</code></RouterLink>&lt;<code v-pre>ToTargetType</code>&lt;<code v-pre>T</code>&gt;, <code v-pre>X</code>&gt;[]</p>
<p>The annotation contexts *</p>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/advices/after-throw/after-throw.context.ts#L13" target="_blank" rel="noopener noreferrer">packages/core/src/advices/after-throw/after-throw.context.ts:13<ExternalLinkIcon/></a></p>
<hr>
<h3 id="args" tabindex="-1"><a class="header-anchor" href="#args" aria-hidden="true">#</a> args</h3>
<p>• <code v-pre>Readonly</code> <strong>args</strong>: <code v-pre>unknown</code>[]</p>
<p>the arguments originally passed to the joinpoint *</p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/advices/after-throw/after-throw.context.ts#L17" target="_blank" rel="noopener noreferrer">packages/core/src/advices/after-throw/after-throw.context.ts:17<ExternalLinkIcon/></a></p>
<hr>
<h3 id="error" tabindex="-1"><a class="header-anchor" href="#error" aria-hidden="true">#</a> error</h3>
<p>• <code v-pre>Readonly</code> <strong>error</strong>: <code v-pre>unknown</code></p>
<p>The error originally thrown by the joinpoint *</p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/advices/after-throw/after-throw.context.ts#L19" target="_blank" rel="noopener noreferrer">packages/core/src/advices/after-throw/after-throw.context.ts:19<ExternalLinkIcon/></a></p>
<hr>
<h3 id="instance" tabindex="-1"><a class="header-anchor" href="#instance" aria-hidden="true">#</a> instance</h3>
<p>• <code v-pre>Readonly</code> <strong>instance</strong>: <code v-pre>X</code></p>
<p>The 'this' instance bound to the current execution context *</p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/advices/after-throw/after-throw.context.ts#L15" target="_blank" rel="noopener noreferrer">packages/core/src/advices/after-throw/after-throw.context.ts:15<ExternalLinkIcon/></a></p>
<hr>
<h3 id="target" tabindex="-1"><a class="header-anchor" href="#target" aria-hidden="true">#</a> target</h3>
<p>• <code v-pre>Readonly</code> <strong>target</strong>: <RouterLink to="/api/modules.html#annotationtarget"><code v-pre>AnnotationTarget</code></RouterLink>&lt;<code v-pre>ToTargetType</code>&lt;<code v-pre>T</code>&gt;, <code v-pre>X</code>&gt;</p>
<p>The symbol targeted by this advice (class, method, property or parameter *</p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/core/src/advices/after-throw/after-throw.context.ts#L21" target="_blank" rel="noopener noreferrer">packages/core/src/advices/after-throw/after-throw.context.ts:21<ExternalLinkIcon/></a></p>
</div></template>


