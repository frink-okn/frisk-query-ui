<script setup lang="ts">
import { queryProviderKey } from '@/stores/query'
import { type Source, type SourceCategory } from '@/modules/sources'
import Yasqe from '@triply/yasqe'
import { inject, ref, onMounted, computed, watch } from 'vue'
import router from '@/router'
import { useRoute } from 'vue-router'
import SaveQueryForm from '@/components/SaveQueryForm.vue'

const DEFAULT_QUERY = `\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT * WHERE {
  ?sub ?pred ?obj .
} LIMIT 10\
`

const { sources, selectedSources, currentSparql, running, executeQuery, stopQuery } =
  inject(queryProviderKey)!

const route = useRoute()
const sourceNames = route.query['sources']
if (sourceNames) {
  const namesArray = Array.isArray(sourceNames) ? sourceNames : [sourceNames]
  sources.value.forEach((s) => {
    if (namesArray.some((n) => n === s.source.shortname)) s.selected = true
    else s.selected = false
  })
}
const queryParam = route.query['query']
const queryParamSingle = Array.isArray(queryParam) ? queryParam[0] : queryParam
currentSparql.value = queryParamSingle ?? DEFAULT_QUERY

const notReadyToRun = computed(
  () => selectedSources.value.length < 1 || currentSparql.value.trim().length < 1
)

const onSourceSelectionChange = (nextSelection: { source: Source; selected: boolean }[]) => {
  sources.value.forEach((currentSource) => {
    if (nextSelection.includes(currentSource)) {
      currentSource.selected = true
    } else {
      currentSource.selected = false
    }
  })
}

const sourceSelectOptions = computed(() => {
  const groupedSources: Map<
    SourceCategory,
    { source: Source; selected: boolean; disabled: boolean }[]
  > = new Map()

  const federatedGraph = sources.value.find(
    ({ source }) => source.name === 'FRINK Federated SPARQL'
  )!
  if (!federatedGraph) console.error('Cannot find FRINK Federated SPARQL')
  for (const source of sources.value) {
    if (source !== federatedGraph) {
      source.disabled = federatedGraph.selected
    } else {
      source.disabled = sources.value.filter((s) => s !== federatedGraph).some((s) => s.selected)
    }

    const group = groupedSources.get(source.source.category)
    if (group !== undefined) group.push(source)
    else groupedSources.set(source.source.category, [source])
  }

  return [...groupedSources.entries()].map(([category, sources]) => {
    const label =
      {
        federation: 'Federation',
        frink: 'Frink Graphs',
        'theme-1': 'Theme 1 Graphs'
      }?.[category] ?? 'Other Graphs'
    return { label, sources }
  })
})

const editorElement = ref(null)
onMounted(() => {
  if (editorElement.value !== null) {
    const previous = globalThis.yasqe?.getValue()
    globalThis.yasqe = new Yasqe(editorElement.value, { persistenceId: null })
    if (previous) globalThis.yasqe.setValue(previous)
    currentSparql.value = globalThis.yasqe.getValue()
    globalThis.yasqe.on('change', () => {
      if (globalThis.yasqe !== null) currentSparql.value = globalThis.yasqe.getValue()
    })
    if (currentSparql.value === '') globalThis.yasqe.setValue(DEFAULT_QUERY)
  }
})

watch(currentSparql, (_newSparql) => {
  pushState()
})
watch(selectedSources, (_newSelectedSources) => {
  pushState()
})
function pushState() {
  const sourceNames: string[] = selectedSources.value.reduce(
    (acc: string[], current) => (current.selected ? acc.concat([current.source.shortname]) : acc),
    []
  )
  router.push({ path: '/', query: { query: currentSparql.value, sources: sourceNames } })
}

const popover = ref()
const togglePopover = (event: any) => {
  popover.value.toggle(event)
}
</script>

<template>
  <div class="flex">
    <div class="label-container">
      <h3>Sources</h3>
      <MultiSelect
        :modelValue="selectedSources"
        @update:modelValue="onSourceSelectionChange"
        :options="sourceSelectOptions"
        optionLabel="source.name"
        optionGroupLabel="label"
        optionGroupChildren="sources"
        optionDisabled="disabled"
        :maxSelectedLabels="3"
        class="multiselect"
        placeholder="Select Sources"
        :pt="{
          header: { style: { display: 'none' } },
          listContainer: { style: { maxHeight: 'none' } }
        }"
      />
    </div>

    <div class="label-container query">
      <h3>SPARQL Query</h3>
      <div ref="editorElement" class="editor-wrapper"></div>
    </div>

    <div class="buttons">
      <Button
        label="Save Query"
        @click="togglePopover"
        severity="secondary"
        icon="pi pi-save"
        iconPos="right"
        size="small"
      />

      <Button
        v-if="!running"
        label="Run Query"
        @click="executeQuery"
        :disabled="notReadyToRun"
        v-tooltip="
          notReadyToRun ? 'Please provide a SPARQL query and at least one source.' : undefined
        "
        icon="pi pi-arrow-right"
        iconPos="right"
        size="small"
      />
      <Button
        v-else
        label="Stop Query"
        @click="stopQuery"
        severity="danger"
        icon="pi pi-stop"
        iconPos="right"
        size="small"
      />
    </div>
  </div>

  <Popover ref="popover">
    <SaveQueryForm @close="togglePopover" />
  </Popover>
</template>

<style scoped>
.flex {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.multiselect {
  width: 100%;
}

.label-container {
  display: flex;
  flex-direction: column;
}

.label-container.query {
  flex: 1;
  display: flex;
  flex-direction: column;

  /*
  By default this is auto, we have to set it to 0 so that it can be
  smaller than its content. This is important for the .editor-wrapper
  to overflow properly.
  */
  min-height: 0px;
}

.label-container > h3 {
  margin: 0px;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.editor-wrapper {
  flex: 1;
  overflow-y: auto;
}

.buttons {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
