<template><div><h1 id="class-annotationregistry" tabindex="-1"><a class="header-anchor" href="#class-annotationregistry" aria-hidden="true">#</a> Class: AnnotationRegistry</h1>
<p>Store all registered annotations</p>
<h2 id="table-of-contents" tabindex="-1"><a class="header-anchor" href="#table-of-contents" aria-hidden="true">#</a> Table of contents</h2>
<h3 id="constructors" tabindex="-1"><a class="header-anchor" href="#constructors" aria-hidden="true">#</a> Constructors</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationRegistry.html#constructor">constructor</RouterLink></li>
</ul>
<h3 id="properties" tabindex="-1"><a class="header-anchor" href="#properties" aria-hidden="true">#</a> Properties</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationRegistry.html#annotationset">annotationSet</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationRegistry.html#targetfactory">targetFactory</RouterLink></li>
</ul>
<h3 id="methods" tabindex="-1"><a class="header-anchor" href="#methods" aria-hidden="true">#</a> Methods</h3>
<ul>
<li><RouterLink to="/api/classes/AnnotationRegistry.html#register">register</RouterLink></li>
<li><RouterLink to="/api/classes/AnnotationRegistry.html#select">select</RouterLink></li>
</ul>
<h2 id="constructors-1" tabindex="-1"><a class="header-anchor" href="#constructors-1" aria-hidden="true">#</a> Constructors</h2>
<h3 id="constructor" tabindex="-1"><a class="header-anchor" href="#constructor" aria-hidden="true">#</a> constructor</h3>
<p>• <strong>new AnnotationRegistry</strong>(<code v-pre>targetFactory</code>)</p>
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
</tbody>
</table>
<h4 id="defined-in" tabindex="-1"><a class="header-anchor" href="#defined-in" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L242" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:242<ExternalLinkIcon/></a></p>
<h2 id="properties-1" tabindex="-1"><a class="header-anchor" href="#properties-1" aria-hidden="true">#</a> Properties</h2>
<h3 id="annotationset" tabindex="-1"><a class="header-anchor" href="#annotationset" aria-hidden="true">#</a> annotationSet</h3>
<p>• <code v-pre>Private</code> <code v-pre>Readonly</code> <strong>annotationSet</strong>: <code v-pre>_AnnotationsSet</code></p>
<h4 id="defined-in-1" tabindex="-1"><a class="header-anchor" href="#defined-in-1" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L241" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:241<ExternalLinkIcon/></a></p>
<hr>
<h3 id="targetfactory" tabindex="-1"><a class="header-anchor" href="#targetfactory" aria-hidden="true">#</a> targetFactory</h3>
<p>• <code v-pre>Private</code> <strong>targetFactory</strong>: <RouterLink to="/api/classes/AnnotationTargetFactory.html"><code v-pre>AnnotationTargetFactory</code></RouterLink></p>
<h4 id="defined-in-2" tabindex="-1"><a class="header-anchor" href="#defined-in-2" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L242" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:242<ExternalLinkIcon/></a></p>
<h2 id="methods-1" tabindex="-1"><a class="header-anchor" href="#methods-1" aria-hidden="true">#</a> Methods</h2>
<h3 id="register" tabindex="-1"><a class="header-anchor" href="#register" aria-hidden="true">#</a> register</h3>
<p>▸ <strong>register</strong>(<code v-pre>annotationContext</code>): <code v-pre>void</code></p>
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
<td style="text-align:left"><code v-pre>annotationContext</code></td>
<td style="text-align:left"><RouterLink to="/api/classes/BindableAnnotationContext.html"><code v-pre>BindableAnnotationContext</code></RouterLink>&lt;<RouterLink to="/api/enums/TargetType.html"><code v-pre>TargetType</code></RouterLink>, <code v-pre>unknown</code>&gt;</td>
</tr>
</tbody>
</table>
<h4 id="returns" tabindex="-1"><a class="header-anchor" href="#returns" aria-hidden="true">#</a> Returns</h4>
<p><code v-pre>void</code></p>
<h4 id="defined-in-3" tabindex="-1"><a class="header-anchor" href="#defined-in-3" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L244" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:244<ExternalLinkIcon/></a></p>
<hr>
<h3 id="select" tabindex="-1"><a class="header-anchor" href="#select" aria-hidden="true">#</a> select</h3>
<p>▸ <strong>select</strong>(<code v-pre>...annotations</code>): <RouterLink to="/api/classes/AnnotationSelection.html"><code v-pre>AnnotationSelection</code></RouterLink></p>
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
<td style="text-align:left"><code v-pre>...annotations</code></td>
<td style="text-align:left">(<RouterLink to="/api/classes/AnnotationRef.html"><code v-pre>AnnotationRef</code></RouterLink> | <RouterLink to="/api/modules.html#annotation"><code v-pre>Annotation</code></RouterLink>)[]</td>
</tr>
</tbody>
</table>
<h4 id="returns-1" tabindex="-1"><a class="header-anchor" href="#returns-1" aria-hidden="true">#</a> Returns</h4>
<p><RouterLink to="/api/classes/AnnotationSelection.html"><code v-pre>AnnotationSelection</code></RouterLink></p>
<h4 id="defined-in-4" tabindex="-1"><a class="header-anchor" href="#defined-in-4" aria-hidden="true">#</a> Defined in</h4>
<p><a href="https://gitlab.com/NicolasThierion/aspectjs-next/-/blob/ef3f3cd/packages/common/src/annotation/registry/annotation.registry.ts#L247" target="_blank" rel="noopener noreferrer">packages/common/src/annotation/registry/annotation.registry.ts:247<ExternalLinkIcon/></a></p>
</div></template>


