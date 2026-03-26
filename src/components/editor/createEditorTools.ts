import type { ToolConstructable, ToolSettings } from '@editorjs/editorjs';
import Delimiter from '@editorjs/delimiter';
import Header from '@editorjs/header';

import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Table from '@editorjs/table';
import Quote from '@editorjs/quote';

import { t, type LanguageCode } from 'src/i18n';

import { DEFAULT_BIBLE_ENDPOINT_PATH, IMAGE_UPLOAD_URL } from './editorConfig';

import BiblePassageTool from './tools/BiblePassageTool/BiblePassageTool';
import BibleReferenceTool from './tools/BibleReferenceTool/BibleReferenceTool';
import CollapsibleGroupTool from './tools/CollapsibleGroupTool/CollapsibleGroupTool';
import CollapsibleTextTool from './tools/CollapsibleTextTool/CollapsibleTextTool';
import ImageTool from './tools/ImageTool/ImageTool';
import IWillTool from './tools/IWillTool/IWillTool';
import LastTimeTool from './tools/LastTimeTool/LastTimeTool';
import NotesAreaTool from './tools/NotesAreaTool/NotesAreaTool';
import OikosListTool from './tools/OikosListTool/OikosListTool';
import SectionMarkerTool from './tools/SectionMarker/SectionMarkerTool';
import TextAreaTool from './tools/TextAreaTool/TextAreaTool';
import TitleTool from './tools/TitleTool/TitleTool';
import VideoTool from './tools/VideoTool/VideoTool';

type EditorTools = Record<string, ToolSettings>;

type SelectOption = {
  value: string;
  label: string;
};

type CreateEditorToolsOptions = {
  titleToolLanguages?: SelectOption[];
  titleToolSeriesOptions?: SelectOption[];
};

export function createEditorTools(
  lang: LanguageCode,
  options: CreateEditorToolsOptions = {},
): EditorTools {
  const titleToolLanguages = options.titleToolLanguages ?? [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
  ];

  const titleToolSeriesOptions = options.titleToolSeriesOptions ?? [
    { value: 'multiply1', label: 'Multiply 1' },
    { value: 'multiply2', label: 'Multiply 2' },
    { value: 'multiply3', label: 'Multiply 3' },
  ];

  return {
    biblePassage: {
      class: BiblePassageTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeGoogle: lang,
      },
    },

    bibleReference: {
      class: BibleReferenceTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeGoogle: lang,
      },
    },

    collapsibleGroup: {
      class: CollapsibleGroupTool as unknown as ToolConstructable,
      config: {
        placeholder: 'Group heading',
        tools: createNestedEditorTools(lang),
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

    iWill: {
      class: IWillTool as unknown as ToolConstructable,
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
      class: OikosListTool as unknown as ToolConstructable,
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
    textArea: {
      class: TextAreaTool as unknown as ToolConstructable,
      config: {
        tools: createNestedEditorTools(lang),
      },
    },
    table: {
      class: Table as unknown as ToolConstructable,
      config: {
        rows: 2,
        cols: 2,
      },
    },

    title: {
      class: TitleTool as unknown as ToolConstructable,
      config: {
        languages: titleToolLanguages,
        seriesOptions: titleToolSeriesOptions,
      },
    },

    video: {
      class: VideoTool as unknown as ToolConstructable,
      config: {
        labels: {
          endLabel: t(lang, 'videoTool.endTime'),
          previewUnavailable: t(lang, 'videoTool.previewUnavailable'),
          startLabel: t(lang, 'videoTool.startTime'),
          titleLabel: t(lang, 'videoTool.titleLabel'),
          untitledVideo: t(lang, 'videoTool.untitledVideo'),
          urlLabel: t(lang, 'videoTool.urlLabel'),
          watchOnlineTemplate: t(lang, 'videoTool.watchOnlineTemplate'),
        },
      },
    },
  };
}

function createNestedEditorTools(lang: string): EditorTools {
  return {
    bibleReference: {
      class: BibleReferenceTool as unknown as ToolConstructable,
      config: {
        endpointPath: DEFAULT_BIBLE_ENDPOINT_PATH,
        languageCodeGoogle: lang,
      },
    },

    delimiter: {
      class: Delimiter as unknown as ToolConstructable,
    },

    header: {
      class: Header as unknown as ToolConstructable,
      config: {
        defaultLevel: 3,
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

    table: {
      class: Table as unknown as ToolConstructable,
      config: {
        rows: 2,
        cols: 2,
      },
    },
  };
}
