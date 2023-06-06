<template><div><h1 id="class-annotationbytypeselection-t-x-p" tabindex="-1"><a class="header-anchor" href="#class-annotationbytypeselection-t-x-p" aria-hidden="true">#</a> Class: AnnotationByTypeSelection&lt;T, X, P&gt;</h1>
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
<tr>
<td style="text-align:left"><code v-pre>P</code></td>
<td style="text-align:left">extends keyof <code v-pre>X</code> = <code v-pre>any</code></td>
</tr>
</tbody>
</table>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#annotationset">annotationSet</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#annotationsrefs">annotationsRefs</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#decoratortypes">decoratorTypes</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#propertykey">propertyKey</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#targetfactory">targetFactory</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#type">type</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationByTypeSelection.html#find">find</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new AnnotationByTypeSelection</strong>&lt;<code v-pre>T</code>, <code v-pre>X</code>, <code v-pre>P</code>&gt;(<code v-pre>targetFactory</code>, <code v-pre>annotationSet</code>, <code v-pre>annotationsRefs</code>, <code v-pre>decoratorTypes</code>, <code v-pre>type?</code>, <code v-pre>propertyKey?</code>)</p>
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
<tr>
<td style="text-align:left"><code v-pre>P</code></td>
<td style="text-align:left">extends <code v-pre>string</code> | <code v-pre>number</code> | <code v-pre>symbol</code> = <code v-pre>any</code></td>
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
<td style="text-align:left"><code v-pre>targetFactory</code></td>
<td style="text-align:left"><RouterLink to="/api/classes/AnnotationTargetFactory.html"><code v-pre>AnnotationTargetFactory</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>annotationSet</code></td>
<td style="text-align:left"><code v-pre>_AnnotationsSet</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>annotationsRefs</code></td>
<td style="text-align:left"><RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink>[]</td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>decoratorTypes</code></td>
<td style="text-align:left"><code v-pre>T</code>[]</td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>type?</code></td>
<td style="text-align:left"><code v-pre>ConstructorType</code>&lt;<code v-pre>X</code>&gt;</td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>propertyKey?</code></td>
<td style="text-align:left"><code v-pre>P</code></td>
</tr>
</tbody>
</table>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L95" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:95<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="annotationset" tabindex="-1"><a class="header-anchor" href="#annotationset" aria-hidden="true">#</a> annotationSet</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>annotationSet</strong>: <code v-pre>_AnnotationsSet</code></p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L97" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:97<ExternalLinkIcon/></a></p>
<hr>
<h3 id="annotationsrefs" tabindex="-1"><a class="header-anchor" href="#annotationsrefs" aria-hidden="true">#</a> annotationsRefs</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>annotationsRefs</strong>: <RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink>[]</p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L98" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:98<ExternalLinkIcon/></a></p>
<hr>
<h3 id="decoratortypes" tabindex="-1"><a class="header-anchor" href="#decoratortypes" aria-hidden="true">#</a> decoratorTypes</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>decoratorTypes</strong>: <code v-pre>T</code>[]</p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L99" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:99<ExternalLinkIcon/></a></p>
<hr>
<h3 id="propertykey" tabindex="-1"><a class="header-anchor" href="#propertykey" aria-hidden="true">#</a> propertyKey</h3>
<p>• <code v-pre>Private</code> <code v-pre>Optional</code> <code v-pre>Readonly</code> <strong>propertyKey</strong>: <code v-pre>P</code></p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L101" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:101<ExternalLinkIcon/></a></p>
<hr>
<h3 id="targetfactory" tabindex="-1"><a class="header-anchor" href="#targetfactory" aria-hidden="true">#</a> targetFactory</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>targetFactory</strong>: <RouterLink to="/api/classes/AnnotationTargetFactory.html"><code v-pre>AnnotationTargetFactory</code></RouterLink></p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L96" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:96<ExternalLinkIcon/></a></p>
<hr>
<h3 id="type" tabindex="-1"><a class="header-anchor" href="#type" aria-hidden="true">#</a> type</h3>
<p>• <code v-pre>Private</code> <code v-pre>Optional</code> <code v-pre>Readonly</code> <strong>type</strong>: <code v-pre>ConstructorType</code>&lt;<code v-pre>X</code>&gt;</p>
<h4 id="defined-in-6" tabindex="-1"><a class="header-anchor" href="#defined-in-6" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L100" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:100<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="find" tabindex="-1"><a class="header-anchor" href="#find" aria-hidden="true">#</a> find</h3>
<p>▸ <strong>find</strong>(<code v-pre>options?</code>): <RouterLink to="/api/classes/BindableAnnotationContext.html"><code v-pre>BindableAnnotationContext</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;[]</p>
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
<td style="text-align:left"><code v-pre>options?</code></td>
<td style="text-align:left"><code v-pre>AnnotationByTypeSelectionOptions</code></td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/classes/BindableAnnotationContext.html"><code v-pre>BindableAnnotationContext</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>X</code>&gt;[]</p>
<h4 id="defined-in-7" tabindex="-1"><a class="header-anchor" href="#defined-in-7" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L104" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:104<ExternalLinkIcon/></a></p>
</div></template>


