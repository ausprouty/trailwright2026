<template>
  <div class="notes-area-block">
    <div class="notes-area-block__label">Notes</div>
    <div class="notes-area-block__box"></div>
  </div>
</template>

<style scoped>
.notes-area-block {
  margin: 20px 0;
  padding: 16px;
  border-radius: 12px;
  background: #fff7e6; /* soft warm highlight */
  border: 2px dashed #d59744;
}

.notes-area-block__label {
  font-weight: 700;
  margin-bottom: 10px;
  color: #a05a2c;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.notes-area-block__box {
  min-height: 100px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #d3b18c;
}
</style>
