<script setup lang="ts">
defineProps<{
  modelValue: string
  label: string
  placeholder?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="search-input">
    <!-- Oculta a la vista, no a un lector de pantalla. -->
    <span class="search-input__label">{{ label }}</span>
    <input
      class="search-input__field"
      type="search"
      autocomplete="off"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.search-input {
  display: block;

  &__label {
    @include visually-hidden;
  }

  &__field {
    width: 100%;
    padding: var(--sp-3) var(--sp-4);
    font: inherit;
    color: var(--c-text);
    background-color: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-input);

    &::placeholder {
      color: var(--c-text-muted);
    }

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: 2px;
    }
  }
}
</style>
