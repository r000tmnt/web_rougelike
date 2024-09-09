<template>
  <router-view />
</template>

<script setup lang="ts">
import * as Phaser from 'phaser';
window.Phaser = Phaser;

const cancelSelection = () => {
  const documentSelection = document.getSelection();
  if (documentSelection) {
    documentSelection.empty();
  }

  const windowSelection = window.getSelection();
  if (windowSelection) {
    windowSelection.removeAllRanges();
  }
};

document.onmousemove = () => {
  cancelSelection();
};

// document.onmouseup = () => {
//   cancelSelection
// }
</script>
