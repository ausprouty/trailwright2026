export const iconListIcons = {
  application: {
    label: 'Application',
    preview: '🔎',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- magnifying glass circle -->
      <circle
        cx="45"
        cy="45"
        r="16"
        fill="none"
        stroke="white"
        stroke-width="6"
      />

      <!-- inner arc -->
      <path
        d="M35 45 A10 10 0 0 1 45 35"
        fill="none"
        stroke="white"
        stroke-width="5"
        stroke-linecap="round"
      />

      <!-- handle -->
      <rect
        x="58"
        y="58"
        width="22"
        height="10"
        rx="5"
        transform="rotate(45 58 58)"
        class="icon-list-icon__fill"
      />
    </svg>
  `,
  },
  background: {
    label: 'Background',
    preview: '▣',
    svg: `
      <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="48"
          class="icon-list-icon__circle"
        />
        <rect
          x="30"
          y="58"
          width="40"
          height="22"
          rx="2"
          class="icon-list-icon__fill"
        />
        <polygon
          points="32,48 38,46 42,58 36,60"
          class="icon-list-icon__fill"
        />
        <polygon
          points="40,44 46,42 48,50 42,52"
          class="icon-list-icon__fill"
        />
        <polygon
          points="44,38 50,36 52,42 46,44"
          class="icon-list-icon__fill"
        />
        <rect
          x="58"
          y="36"
          width="10"
          height="22"
          rx="2"
          class="icon-list-icon__fill"
        />
      </svg>
    `,
  },

  'bible-study': {
    label: 'Bible Study',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- book base -->
      <rect
        x="28"
        y="34"
        width="44"
        height="36"
        rx="4"
        class="icon-list-icon__fill"
      />

      <!-- bookmark -->
      <polygon
        points="50,34 60,34 60,60 55,56 50,60"
        class="icon-list-icon__circle"
      />

      <!-- right page edge -->
      <polygon
        points="72,34 78,38 78,70 72,70"
        class="icon-list-icon__fill"
      />
    </svg>
  `,
  },
  bullet: {
    label: 'Bullet',
    preview: '•',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="12"
        class="icon-list-icon__circle"
      />
    </svg>
  `,
  },

  challenges: {
    label: 'Challenges',
    preview: '👣',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- left footprint -->
      <ellipse
        cx="38"
        cy="52"
        rx="8"
        ry="14"
        class="icon-list-icon__fill"
        transform="rotate(-15 38 52)"
      />
      <ellipse
        cx="34"
        cy="68"
        rx="5"
        ry="6"
        class="icon-list-icon__fill"
        transform="rotate(-10 34 68)"
      />

      <!-- right footprint -->
      <ellipse
        cx="62"
        cy="42"
        rx="8"
        ry="14"
        class="icon-list-icon__fill"
        transform="rotate(20 62 42)"
      />
      <ellipse
        cx="58"
        cy="58"
        rx="5"
        ry="6"
        class="icon-list-icon__fill"
        transform="rotate(15 58 58)"
      />
    </svg>
  `,
  },
  film: {
    label: 'Film',
    preview: '▶',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- film strip body -->
      <rect
        x="28"
        y="34"
        width="44"
        height="32"
        rx="4"
        class="icon-list-icon__fill"
      />

      <!-- sprocket holes left -->
      <rect x="28" y="38" width="4" height="4" fill="black" />
      <rect x="28" y="46" width="4" height="4" fill="black" />
      <rect x="28" y="54" width="4" height="4" fill="black" />

      <!-- sprocket holes right -->
      <rect x="68" y="38" width="4" height="4" fill="black" />
      <rect x="68" y="46" width="4" height="4" fill="black" />
      <rect x="68" y="54" width="4" height="4" fill="black" />

      <!-- play triangle -->
      <polygon
        points="44,40 60,50 44,60"
        fill="black"
      />
    </svg>
  `,
  },
  information: {
    label: 'Information',
    preview: 'ℹ',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- dot -->
      <circle
        cx="50"
        cy="28"
        r="6"
        class="icon-list-icon__fill"
      />

      <!-- stem -->
      <rect
        x="46"
        y="38"
        width="8"
        height="28"
        class="icon-list-icon__fill"
      />

      <!-- base serif -->
      <rect
        x="40"
        y="66"
        width="20"
        height="6"
        class="icon-list-icon__fill"
      />
    </svg>
  `,
  },
  review: {
    label: 'Review',
    preview: '↩',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- curved arrow body -->
      <path
        d="M68 36
           C62 44, 52 48, 40 48
           L40 40
           L24 52
           L40 64
           L40 56
           C56 56, 68 50, 76 36
           Z"
        class="icon-list-icon__fill"
      />
    </svg>
  `,
  },

  'sharing-life': {
    label: 'Sharing Life',
    preview: '💬',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <!-- outer circle -->
      <circle
        cx="50"
        cy="50"
        r="48"
        class="icon-list-icon__circle"
      />

      <!-- large speech bubble -->
      <circle
        cx="58"
        cy="46"
        r="16"
        class="icon-list-icon__fill"
      />
      <polygon
        points="54,60 64,56 60,66"
        class="icon-list-icon__fill"
      />

      <!-- small speech bubble -->
      <circle
        cx="40"
        cy="56"
        r="10"
        class="icon-list-icon__fill"
      />
      <polygon
        points="36,64 42,62 40,68"
        class="icon-list-icon__fill"
      />
    </svg>
  `,
  },
};
