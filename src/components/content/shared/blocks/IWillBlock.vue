<template>
  <div class="i-will-block">
    <div class="i-will-block__label">I will</div>
    <div class="i-will-block__box"></div>
  </div>
</template>

<style scoped>
.i-will-block {
  margin: 24px 0;
  padding: 18px;
  border-radius: 12px;
  background: #eaf7ea; /* light green = action */
  border: 2px solid #65c058;
}

.i-will-block__label {
  font-weight: 700;
  margin-bottom: 10px;
  color: #2e7d32;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.i-will-block__box {
  min-height: 80px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #b6e2b6;
}
</style>
