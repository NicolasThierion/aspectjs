<template><div><h1 id="class-annotationfactory" tabindex="-1"><a class="header-anchor" href="#class-annotationfactory" aria-hidden="true">#</a> Class: AnnotationFactory</h1>
<p>Factory to create an <RouterLink to="/api/modules.html#annotation">Annotation</RouterLink>.</p>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationFactory.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationFactory.html#groupid">groupId</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationFactory.html#createannotation">_createAnnotation</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationFactory.html#createdecorator">_createDecorator</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationFactory.html#create">create</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new AnnotationFactory</strong>(<code v-pre>groupId</code>)</p>
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
<td style="text-align:left"><code v-pre>groupId</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
</tbody>
</table>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L35" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:35<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="groupid" tabindex="-1"><a class="header-anchor" href="#groupid" aria-hidden="true">#</a> groupId</h3>
<p>• <code v-pre>Readonly</code> <strong>groupId</strong>: <code v-pre>string</code></p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L33" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:33<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="createannotation" tabindex="-1"><a class="header-anchor" href="#createannotation" aria-hidden="true">#</a> _createAnnotation</h3>
<p>▸ <code v-pre>Private</code> <strong>_createAnnotation</strong>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;(<code v-pre>groupId</code>, <code v-pre>name</code>, <code v-pre>stub</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
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
<td style="text-align:left">extends <RouterLink to="/api/enums/AnnotationType.html"><code v-pre>AnnotationType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
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
<td style="text-align:left"><code v-pre>groupId</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>name</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>stub</code></td>
<td style="text-align:left"><code v-pre>S</code></td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L135" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:135<ExternalLinkIcon/></a></p>
<hr>
<h3 id="createdecorator" tabindex="-1"><a class="header-anchor" href="#createdecorator" aria-hidden="true">#</a> _createDecorator</h3>
<p>▸ <code v-pre>Private</code> <strong>_createDecorator</strong>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;(<code v-pre>annotation</code>, <code v-pre>annotationStub</code>, <code v-pre>annotationArgs</code>): <RouterLink to="/api/modules.html#decorator"><code v-pre>Decorator</code></RouterLink></p>
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
<td style="text-align:left">extends <RouterLink to="/api/enums/AnnotationType.html"><code v-pre>AnnotationType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
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
<td style="text-align:left"><code v-pre>annotation</code></td>
<td style="text-align:left"><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>annotationStub</code></td>
<td style="text-align:left"><code v-pre>S</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>annotationArgs</code></td>
<td style="text-align:left"><code v-pre>any</code>[]</td>
</tr>
</tbody>
</table>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#decorator"><code v-pre>Decorator</code></RouterLink></p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L98" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:98<ExternalLinkIcon/></a></p>
<hr>
<h3 id="create" tabindex="-1"><a class="header-anchor" href="#create" aria-hidden="true">#</a> create</h3>
<p>▸ <strong>create</strong>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;(<code v-pre>type?</code>, <code v-pre>name?</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
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
<td style="text-align:left">extends <RouterLink to="/api/enums/AnnotationType.html"><code v-pre>AnnotationType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
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
<td style="text-align:left"><code v-pre>type?</code></td>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>name?</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-2" tabindex="-1"><a class="header-anchor" href="#returns-2" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L38" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:38<ExternalLinkIcon/></a></p>
<p>▸ <strong>create</strong>&lt;<code v-pre>S</code>&gt;(<code v-pre>name?</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>, <code v-pre>S</code>&gt;</p>
<h4 id="type-parameters-3" tabindex="-1"><a class="header-anchor" href="#type-parameters-3" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>&gt;</td>
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
<td style="text-align:left"><code v-pre>name?</code></td>
<td style="text-align:left"><code v-pre>string</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-3" tabindex="-1"><a class="header-anchor" href="#returns-3" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-5" tabindex="-1"><a class="header-anchor" href="#defined-in-5" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L43" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:43<ExternalLinkIcon/></a></p>
<p>▸ <strong>create</strong>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;(<code v-pre>type?</code>, <code v-pre>annotationStub?</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="type-parameters-4" tabindex="-1"><a class="header-anchor" href="#type-parameters-4" aria-hidden="true">#</a> Type parameters</h4>
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
<td style="text-align:left">extends <RouterLink to="/api/enums/AnnotationType.html"><code v-pre>AnnotationType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
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
<td style="text-align:left"><code v-pre>type?</code></td>
<td style="text-align:left"><code v-pre>T</code></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>annotationStub?</code></td>
<td style="text-align:left"><code v-pre>S</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-4" tabindex="-1"><a class="header-anchor" href="#returns-4" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-6" tabindex="-1"><a class="header-anchor" href="#defined-in-6" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L47" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:47<ExternalLinkIcon/></a></p>
<p>▸ <strong>create</strong>&lt;<code v-pre>S</code>&gt;(<code v-pre>annotationStub?</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>, <code v-pre>S</code>&gt;</p>
<h4 id="type-parameters-5" tabindex="-1"><a class="header-anchor" href="#type-parameters-5" aria-hidden="true">#</a> Type parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="parameters-6" tabindex="-1"><a class="header-anchor" href="#parameters-6" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>annotationStub?</code></td>
<td style="text-align:left"><code v-pre>S</code></td>
</tr>
</tbody>
</table>
<h4 id="returns-5" tabindex="-1"><a class="header-anchor" href="#returns-5" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<RouterLink to="/api/enums/AnnotationType.html#any"><code v-pre>ANY</code></RouterLink>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-7" tabindex="-1"><a class="header-anchor" href="#defined-in-7" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L52" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:52<ExternalLinkIcon/></a></p>
<p>▸ <strong>create</strong>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;(<code v-pre>init?</code>): <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="type-parameters-6" tabindex="-1"><a class="header-anchor" href="#type-parameters-6" aria-hidden="true">#</a> Type parameters</h4>
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
<td style="text-align:left">extends <RouterLink to="/api/enums/AnnotationType.html"><code v-pre>AnnotationType</code></RouterLink></td>
</tr>
<tr>
<td style="text-align:left"><code v-pre>S</code></td>
<td style="text-align:left">extends <RouterLink to="/api/modules.html#annotationstub"><code v-pre>AnnotationStub</code></RouterLink>&lt;<code v-pre>T</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="parameters-7" tabindex="-1"><a class="header-anchor" href="#parameters-7" aria-hidden="true">#</a> Parameters</h4>
<table>
<thead>
<tr>
<th style="text-align:left">Name</th>
<th style="text-align:left">Type</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:left"><code v-pre>init?</code></td>
<td style="text-align:left"><code v-pre>AnnotationCreateOptions</code>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="returns-6" tabindex="-1"><a class="header-anchor" href="#returns-6" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>&lt;<code v-pre>T</code>, <code v-pre>S</code>&gt;</p>
<h4 id="defined-in-8" tabindex="-1"><a class="header-anchor" href="#defined-in-8" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/factory/annotation.factory.ts#L56" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/factory/annotation.factory.ts:56<ExternalLinkIcon/></a></p>
</div></template>


