import Table from '@editorjs/table';
import BiblePassageTool from './tools/BiblePassageTool/BiblePassageTool';
import BibleReferenceTool from './tools/BibleReferenceTool/BibleReferenceTool';
import CollapsibleGroupTool from './tools/CollapsibleGroupTool/CollapsibleGroupTool';
import IconListTool from './tools/IconListTool/IconListTool';
import ImageTool from './tools/ImageTool/ImageTool';
import IWillTool from './tools/IWillTool/IWillTool';
import LastTimeTool from './tools/LastTimeTool/LastTimeTool';
import NotesAreaTool from './tools/NotesAreaTool/NotesAreaTool';
import OikosListTool from './tools/OikosListTool/OikosListTool';
import SectionMarkerTool from './tools/SectionMarker/SectionMarkerTool';
import TextAreaTool from './tools/TextAreaTool/TextAreaTool';
import TitleTool from './tools/TitleTool/TitleTool';
import VideoTool from './tools/VideoTool/VideoTool';

import 'src/components/editor/icons.css';

export type InsertToolItem = {
  type: string;
  label: string;
  icon: string;
  initialData?: Record<string, unknown>;
};

type ToolboxMeta = {
  title?: string;
  icon?: string;
};

function getToolboxMeta(
  toolClass: unknown,
  fallbackTitle: string,
): {
  label: string;
  icon: string;
} {
  const candidate = toolClass as {
    toolbox?: ToolboxMeta;
  };

  const toolbox = candidate.toolbox ?? {};

  return {
    label: toolbox.title || fallbackTitle,
    icon: toolbox.icon || '',
  };
}

const biblePassageMeta = getToolboxMeta(BiblePassageTool, 'Bible Passage');
const bibleReferenceMeta = getToolboxMeta(BibleReferenceTool, '{Bible Reference}');
const collapsibleGroupMeta = getToolboxMeta(CollapsibleGroupTool, 'Collapsible Group');
const iconListMeta = getToolboxMeta(IconListTool, 'Icon List');
const imageMeta = getToolboxMeta(ImageTool, 'Image');
const iWillMeta = getToolboxMeta(IWillTool, 'I Will');
const lastTimeMeta = getToolboxMeta(LastTimeTool, 'Last Time');
const notesAreaMeta = getToolboxMeta(NotesAreaTool, 'Notes Area');
const oikosListMeta = getToolboxMeta(OikosListTool, 'Oikos List Area');
const sectionMarkerMeta = getToolboxMeta(SectionMarkerTool, 'Section Marker');
const textAreaMeta = getToolboxMeta(TextAreaTool, 'Text');
const tableMeta = getToolboxMeta(Table, 'Table');
const titleMeta = getToolboxMeta(TitleTool, 'Title');
const videoMeta = getToolboxMeta(VideoTool, 'Video');

const rawInsertToolPalette: InsertToolItem[] = [
  {
    type: 'biblePassage',
    label: biblePassageMeta.label,
    icon: biblePassageMeta.icon,
    initialData: {
      reference: '',
      html: '',
      url: '',
      isOpen: true,
    },
  },
  {
    type: 'bibleReference',
    label: bibleReferenceMeta.label,
    icon: bibleReferenceMeta.icon,
    initialData: {
      text: '',
      references: [],
      isOpen: true,
    },
  },
  {
    type: 'collapsibleGroup',
    label: collapsibleGroupMeta.label,
    icon: collapsibleGroupMeta.icon,
    initialData: {
      title: '',
      items: [],
    },
  },
  {
    type: 'iconList',
    label: iconListMeta.label,
    icon: iconListMeta.icon,
    initialData: {
      items: [],
    },
  },
  {
    type: 'image',
    label: imageMeta.label,
    icon: imageMeta.icon,
  },

  {
    type: 'iWill',
    label: iWillMeta.label,
    icon: iWillMeta.icon,
    initialData: {
      storageKey: '',
    },
  },

  {
    type: 'lastTime',
    label: lastTimeMeta.label,
    icon: lastTimeMeta.icon,
    initialData: {},
  },
  {
    type: 'notesArea',
    label: notesAreaMeta.label,
    icon: notesAreaMeta.icon,
    initialData: {
      storageKey: '',
    },
  },
  {
    type: 'oikosList',
    label: oikosListMeta.label,
    icon: oikosListMeta.icon,
    initialData: {},
  },
  {
    type: 'table',
    label: 'Table',
    icon: tableMeta.icon,
  },
  {
    type: 'sectionMarker',
    label: sectionMarkerMeta.label,
    icon: sectionMarkerMeta.icon,
    initialData: {
      theme: 'back',
    },
  },
  {
    type: 'textArea',
    label: textAreaMeta.label,
    icon: textAreaMeta.icon,
    initialData: {
      content: {
        time: Date.now(),
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: '',
            },
          },
        ],
      },
    },
  },
  {
    type: 'title',
    label: titleMeta.label,
    icon: titleMeta.icon,
    initialData: {
      seriesNumber: '',
      title: '',
      language: 'english',
      series: 'multiply1',
      isOpen: true,
    },
  },
  {
    type: 'video',
    label: videoMeta.label,
    icon: videoMeta.icon,
    initialData: {
      title: '',
      url: '',
      source: '',
      refId: '',
      startTime: '',
      endTime: '',
      isOpen: true,
      isEditing: true,
    },
  },
];

export const insertToolPalette: InsertToolItem[] = [...rawInsertToolPalette].sort((a, b) =>
  a.label.localeCompare(b.label),
);
