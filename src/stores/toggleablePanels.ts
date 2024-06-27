import { ref, type InjectionKey, type Ref } from "vue";

interface ToggleablePanel {
  id: string;
  label: string;
  icon: string;
  color: string;
  selected: boolean
}

const toggleablePanels = ref<ToggleablePanel[]>([
  {
    id: "examples",
    label: "Examples",
    icon: "pi-book",
    color: "var(--p-teal-400)",
    selected: false,
  },
  {
    id: "saved",
    label: "Saved",
    icon: "pi-bookmark",
    color: "var(--p-amber-400)",
    selected: false,
  }
]);

const togglePanel = (id: string) => {
  const current = toggleablePanels.value.find(p => p.id === id)?.selected;
  if (current === undefined) return;
  toggleablePanels.value.find(p => p.id === id)!.selected = !current;
}

export const toggleablePanelsKey = Symbol() as InjectionKey<{
  toggleablePanels: Ref<ToggleablePanel[]>;
  togglePanel: (index: string) => void
}>

export const toggleablePanelsProvider = {
  toggleablePanels,
  togglePanel
}