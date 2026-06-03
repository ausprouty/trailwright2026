export const iconListIcons = {
  application: {
    label: 'Application',
    preview: '🔎',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <circle
        cx="45"
        cy="45"
        r="16"
        fill="none"
        stroke="#fff"
        stroke-width="6"
      />

      <path
        d="M35 45 A10 10 0 0 1 45 35"
        fill="none"
        stroke="#fff"
        stroke-width="5"
        stroke-linecap="round"
      />

      <rect
        x="58"
        y="58"
        width="22"
        height="10"
        rx="5"
        transform="rotate(45 58 58)"
        fill="#fff"
      />
    </svg>
  `,
  },

  background: {
    label: 'Background',
    preview: '▣',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <rect x="30" y="58" width="40" height="22" rx="2" fill="#fff" />
      <polygon points="32,48 38,46 42,58 36,60" fill="#fff" />
      <polygon points="40,44 46,42 48,50 42,52" fill="#fff" />
      <polygon points="44,38 50,36 52,42 46,44" fill="#fff" />
      <rect x="58" y="36" width="10" height="22" rx="2" fill="#fff" />
    </svg>
  `,
  },

  'bible-study': {
    label: 'Bible Study',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <rect x="28" y="34" width="44" height="36" rx="4" fill="#fff" />

      <polygon
        points="50,34 60,34 60,60 55,56 50,60"
        fill="#000"
      />

      <polygon points="72,34 78,38 78,70 72,70" fill="#fff" />
    </svg>
  `,
  },

  bullet: {
    label: 'Bullet',
    preview: '•',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="12" fill="#000" />
    </svg>
  `,
  },

  challenges: {
    label: 'Challenges',
    preview: '👣',
    svg: `
  <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="48" fill="#000" stroke="#fff" stroke-width="3" />

  <g transform="translate(48.08 2.44) scale(0.5)" fill="#fff">
    <!-- Right front print -->
    <path
      d="M16.62890625 47.1015625
      C9.43981674 59.20867838 7.03237799 71.22426026 9.5234375 85.18359375
      C10.64624535 89.32875423 12.29720112 91.5611568 15.8359375 94.12109375
      C21.83273804 96.8448314 28.89337784 98.87205749 35.4609375 97.62109375
      C43.38065442 92.61916727 48.11101587 83.30914124 50.6484375 74.55859375
      C53.3813291 62.33085592 53.02533818 49.80166167 46.9609375 38.68359375
      C43.60197251 34.63307714 41.31176842 33.34246839 36.0859375 32.55859375
      C27.10366509 32.99757699 21.35824189 40.20107476 16.62890625 47.1015625Z"
    />

    <!-- Left front print -->
    <path
      d="M-46.34765625 67.74609375
      C-52.66968879 78.86175536 -52.07263039 93.05152631 -49.1640625 105.12109375
      C-46.72703308 112.432182 -41.59575771 121.83329694 -35.1640625 126.12109375
      C-27.10575686 127.25960666 -19.03672019 125.54150481 -12.1640625 121.24609375
      C-6.56317612 115.29515197 -6.98324878 105.88247418 -7.1640625 98.12109375
      C-8.57630618 86.45869437 -15.21761331 73.19217739 -24.0859375 65.44140625
      C-31.65024873 60.49551044 -40.44517756 59.64236063 -46.34765625 67.74609375Z"
    />

    <!-- Right heel -->
    <path
      d="M5.0859375 99.93359375
      C2.43544267 104.5719597 2.24548215 108.91360561 2.8359375 114.12109375
      C4.50946221 119.82381111 6.69798498 123.87607111 11.8359375 127.12109375
      C15.55023094 128.97824047 19.78216221 128.56457302 23.8359375 128.12109375
      C29.57629277 125.30507041 33.62662107 120.94283209 36.1484375 115.05859375
      C36.82182622 112.18138741 37.30960543 110.04204596 36.8359375 107.12109375
      C33.49841785 103.80860549 29.99238116 103.38085676 25.4609375 102.62109375
      C20.34656168 101.76015674 16.40867216 100.55678841 11.8359375 98.12109375
      C8.49580401 97.57735109 7.46566861 97.46887224 5.0859375 99.93359375Z"
    />

    <!-- Left heel -->
    <path
      d="M-18.359375 130.10546875
      C-22.39348412 131.56628821 -26.45220357 132.09304971 -30.6953125 132.62890625
      C-33.32969808 132.91659166 -33.32969808 132.91659166 -35.1640625 135.12109375
      C-35.77462758 141.12498371 -35.03648295 145.30308227 -31.1640625 150.12109375
      C-27.02863424 154.29411681 -23.90061133 156.91456176 -17.8515625 157.37109375
      C-12.57468202 157.01333914 -9.50214007 155.57067778 -5.9140625 151.68359375
      C-2.8149425 147.1455966 -1.87092469 144.26635892 -1.8515625 138.68359375
      C-1.83480469 137.57113281 -1.81804687 136.45867187 -1.80078125 135.3125
      C-2.20123506 131.79453485 -3.01093947 129.90990072 -5.1640625 127.12109375
      C-10.09810057 126.03801222 -13.91848176 128.18873063 -18.359375 130.10546875Z"
    />
  </g>
</svg>
  `,
  },
  discover: {
    label: 'Discover',
    preview: '🔎',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <circle
        cx="45"
        cy="45"
        r="16"
        fill="none"
        stroke="#fff"
        stroke-width="6"
      />

      <path
        d="M35 45 A10 10 0 0 1 45 35"
        fill="none"
        stroke="#fff"
        stroke-width="5"
        stroke-linecap="round"
      />

      <rect
        x="58"
        y="58"
        width="22"
        height="10"
        rx="5"
        transform="rotate(45 58 58)"
        fill="#fff"
      />
    </svg>
  `,
  },

  film: {
    label: 'Film',
    preview: '▶',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <rect x="28" y="34" width="44" height="32" rx="4" fill="#fff" />

      <rect x="28" y="38" width="4" height="4" fill="#000" />
      <rect x="28" y="46" width="4" height="4" fill="#000" />
      <rect x="28" y="54" width="4" height="4" fill="#000" />

      <rect x="68" y="38" width="4" height="4" fill="#000" />
      <rect x="68" y="46" width="4" height="4" fill="#000" />
      <rect x="68" y="54" width="4" height="4" fill="#000" />

      <polygon points="44,40 60,50 44,60" fill="#000" />
    </svg>
  `,
  },

  information: {
    label: 'Information',
    preview: 'ℹ',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <circle cx="50" cy="28" r="6" fill="#fff" />
      <rect x="46" y="38" width="8" height="28" fill="#fff" />
      <rect x="40" y="66" width="20" height="6" fill="#fff" />
    </svg>
  `,
  },

  review: {
    label: 'Review',
    preview: '↩',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <path
        d="M68 36
           C62 44, 52 48, 40 48
           L40 40
           L24 52
           L40 64
           L40 56
           C56 56, 68 50, 76 36
           Z"
        fill="#fff"
      />
    </svg>
  `,
  },
  'sharing-life': {
    label: 'Sharing Life',
    preview: '💬',
    svg: `<svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="48" fill="#000" stroke="#000" stroke-width="5" />

  <path
    d="M56 25
       C72 25 84 37 84 52
       C84 59 81 65 76 70
       L80 82
       L66 75
       C63 76 60 77 56 77
       C40 77 28 65 28 52
       C28 37 40 25 56 25Z"
    fill="#fff"
  />

  <path
    d="M36 45
       C48 45 58 54 58 65
       C58 76 48 85 36 85
       C32 85 29 84 26 83
       L14 89
       L18 78
       C15 74 14 70 14 65
       C14 54 24 45 36 45Z"
    fill="#fff"
    stroke="#000"
    stroke-width="5"
    stroke-linejoin="round"
  />
</svg>
  `,
  },

  'sharing-lifex': {
    label: 'Sharing Life',
    preview: '💬',
    svg: `
    <svg class="icon-list-icon" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#000" />

      <circle cx="58" cy="46" r="16" fill="#fff" />
      <polygon points="54,60 64,56 60,66" fill="#000" />

      <circle cx="40" cy="56" r="10" fill="#fff" />
      <polygon points="36,64 42,62 40,68" fill="#000" />
    </svg>
  `,
  },
};
