import { t, type LanguageCode } from 'src/i18n';
import type { ToolConstructable, ToolSettings } from '@editorjs/editorjs';
import Delimiter from '@editorjs/delimiter';
import Header from '@editorjs/header';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';

import { DEFAULT_BIBLE_ENDPOINT_PATH, IMAGE_UPLOAD_URL } from './editorConfig';
import BiblePassageTool from './tools/BiblePassageTool/BiblePassageTool';
import BibleReferenceTool from './tools/BibleReferenceTool/BibleReferenceTool';
import CollapsibleGroupTool from './tools/CollapsibleGroupTool/CollapsibleGroupTool';
import CollapsibleTextTool from './tools/CollapsibleTextTool/CollapsibleTextTool';
import LastTimeTool from './tools/LastTimeTool/LastTimeTool';
import OikosListTool from './tools/OikosListTool/OikosListTool';
import NotesAreaTool from './tools/NotesAreaTool/NotesAreaTool';
import SectionMarkerTool from './tools/SectionMarker/SectionMarkerTool';
import TitleTool from './tools/TitleTool/TitleTool';
import VideoTool from './tools/VideoTool/VideoTool';

type EditorTools = Record<string, ToolSettings>;

function createNestedEditorTools(): EditorTools {
  return {
    bibleReference: {
      class: BibleReferenceTool,
    },

    delimiter: {
      class: Delimiter as unknown as ToolConstructable,
    },

    header: {
      class: Header as unknown as ToolConstructable,
      config: {
        defaultLevel: 2,
        levels: [2, 3, 4],
      },
      inlineToolbar: ['link', 'bold', 'italic'],
    },

    list: {
      class: List as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    notesArea: {
      class: NotesAreaTool as unknown as ToolConstructable,
    },

    paragraph: {
      class: Paragraph as unknown as ToolConstructable,
      inlineToolbar: ['link', 'bold', 'italic'],
    },

    quote: {
      class: Quote as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    sectionMarker: {
      class: SectionMarkerTool as unknown as ToolConstructable,
    },
  };
}

export function createEditorTools(lang: LanguageCode): EditorTools {
  return {
    biblePassage: {
      class: BiblePassageTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeIso: lang,
      },
    },
    bibleReference: {
      class: BibleReferenceTool,
    },
    collapsibleGroup: {
      class: CollapsibleGroupTool as unknown as ToolConstructable,
      config: {
        placeholder: 'Group heading',
        tools: createNestedEditorTools(),
      },
    },

    collapsibleText: {
      class: CollapsibleTextTool as unknown as ToolConstructable,
    },

    delimiter: {
      class: Delimiter as unknown as ToolConstructable,
    },

    header: {
      class: Header as unknown as ToolConstructable,
      config: {
        defaultLevel: 2,
        levels: [2, 3, 4],
      },
      inlineToolbar: ['link', 'bold', 'italic'],
    },

    image: {
      class: ImageTool as unknown as ToolConstructable,
      config: {
        endpoints: {
          byFile: IMAGE_UPLOAD_URL,
        },
      },
    },
    lastTime: {
      class: LastTimeTool as unknown as ToolConstructable,
      config: {
        lang,
      },
    },

    list: {
      class: List as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    notesArea: {
      class: NotesAreaTool as unknown as ToolConstructable,
    },
    oikosList: {
      class: OikosListTool,
    },

    paragraph: {
      class: Paragraph as unknown as ToolConstructable,
      inlineToolbar: ['link', 'bold', 'italic'],
    },

    quote: {
      class: Quote as unknown as ToolConstructable,
      inlineToolbar: true,
    },

    sectionMarker: {
      class: SectionMarkerTool as unknown as ToolConstructable,
    },
    videoEmbed: {
      class: VideoTool as unknown as ToolConstructable,
      config: {
        labels: {
          endLabel: t(lang, 'videoTool.endTime'),
          previewUnavailable: t(lang, 'videoTool.previewUnavailable'),
          startLabel: t(lang, 'videoTool.startTime'),
          titleLabel: t(lang, 'videoTool.titleLabel'),
          untitledVideo: t(lang, 'videoTool.untitledVideo'),
          urlLabel: t(lang, 'videoTool.urlLabel '),
          watchOnlineTemplate: t(lang, 'videoTool.watchOnlineTemplate'),
        },
      },
    },
    titleTool: {
      class: TitleTool as unknown as ToolConstructable,
      config: {
        languages: [
          { value: 'english', label: 'English' },
          { value: 'spanish', label: 'Spanish' },
          { value: 'french', label: 'French' },
        ],
        seriesOptions: [
          { value: 'multiply1', label: 'Multiply 1' },
          { value: 'multiply2', label: 'Multiply 2' },
          { value: 'multiply3', label: 'Multiply 3' },
        ],
      },
    },
  };
}
