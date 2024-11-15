<script setup lang="ts">
import type { Term } from '@rdfjs/types'

defineProps<{
  term?: Term
}>()
</script>

<template>
  <span class="term" v-if="term?.termType === 'NamedNode'">
    <RouterLink :to="{ path: '/term', query: { iri: term.value } }">{{
      term.value
    }}</RouterLink> </span
  ><span class="term blanknode" v-else-if="term?.termType === 'BlankNode'">{{ term.value }}</span>
  <span class="term" v-else-if="term?.termType === 'Literal'"
    >{{ term.value }}<span class="lang" v-if="term.language.length > 0">@{{ term.language }}</span
    ><span
      class="datatype"
      v-if="term.datatype.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'"
      >^^{{ term.datatype.value }}</span
    ></span
  >
  <span class="term" v-else>{{ term?.value }}</span>
</template>

<style scoped>
.term {
  font-size: small;
}
.blanknode {
  color: gray;
}
.lang {
  color: gray;
  font-size: x-small;
}
.datatype {
  color: gray;
  font-size: x-small;
}
</style>
