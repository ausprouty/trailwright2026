import BiblePassageTool from "./tools/BiblePassageTool/BiblePassageTool";
import BibleReferenceTool  from "./tools/BibleReferenceTool/BibleReferenceTool";
import CollapsibleGroupTool from "./tools/CollapsibleGroupTool/CollapsibleGroupTool";
import CollapsibleTextTool from "./tools/CollapsibleTextTool/CollapsibleTextTool";
import ImageTool from "@editorjs/image";
import LastTimeTool from "./tools/LastTimeTool/LastTimeTool";
import NotesAreaTool from "./tools/NotesAreaTool/NotesAreaTool";
import SectionMarkerTool from "./tools/SectionMarker/SectionMarkerTool";
import TitleTool from "./tools/TitleTool/TitleTool";
import VideoTool from "./tools/VideoTool/VideoTool";

export type InsertToolItem = {
  type: string;
  label: string;
  icon: string;
  initialData?: Record<string, unknown>;
};

function getToolboxMeta(toolClass: any, fallbackTitle: string) {
  const toolbox = toolClass.toolbox || {};
  return {
    label: toolbox.title || fallbackTitle,
    icon: toolbox.icon || "",
  };
}

const biblePassageMeta = getToolboxMeta(
  BiblePassageTool,
  "Bible Passage"
);

const bibleReferenceMeta = getToolboxMeta(
  BibleReferenceTool,
  "Bible Reference"
);
const collapsibleGroupMeta = getToolboxMeta(
  CollapsibleGroupTool,
  "Collapsible Group"
);
const collapsibleTextMeta = getToolboxMeta(
  CollapsibleTextTool,
  "Collapsible Text"
);
const imageMeta = getToolboxMeta(ImageTool, "Image");
const lastTimeMeta = getToolboxMeta(LastTimeTool, "Last Time");
const notesAreaMeta = getToolboxMeta(NotesAreaTool, "Notes Area");
const sectionMarkerMeta = getToolboxMeta(
  SectionMarkerTool,
  "Section Marker"
);
const titleMeta = getToolboxMeta(TitleTool, "Title");
const videoMeta = getToolboxMeta(VideoTool, "Video");

export const insertToolPalette: InsertToolItem[] = [
  {
    type: "titleTool",
    label: titleMeta.label,
    icon: titleMeta.icon,
    initialData: {
      seriesNumber: "",
      title: "",
      language: "english",
      series: "multiply1",
      isOpen: true,
    },
  },
  {
    type: "biblePassage",
    label: biblePassageMeta.label,
    icon: biblePassageMeta.icon,
    initialData: {
      reference: "",
      passage: "",
      isOpen: true,
    },
  },
  {
    type: "bibleReference",
    label: bibleReferenceMeta.label,
    icon: bibleReferenceMeta.icon,
    initialData: {
      text: "",
      references: [],
    },
  },
  {
    type: "collapsibleGroup",
    label: collapsibleGroupMeta.label,
    icon: collapsibleGroupMeta.icon,
    initialData: {
      heading: "",
      body: "",
      isOpen: true,
    },
  },
  {
    type: "collapsibleText",
    label: collapsibleTextMeta.label,
    icon: collapsibleTextMeta.icon,
    initialData: {
      heading: "",
      body: "",
      isOpen: true,
    },
  },
  {
    type: "image",
    label: imageMeta.label,
    icon: imageMeta.icon,
  },
  {
    type: "lastTime",
    label: lastTimeMeta.label,
    icon: lastTimeMeta.icon,
    initialData: {},
  },
  {
    type: "notesArea",
    label: notesAreaMeta.label,
    icon: notesAreaMeta.icon,
    initialData: {
      noteId: "",
    },
  },
  {
    type: "sectionMarker",
    label: sectionMarkerMeta.label,
    icon: sectionMarkerMeta.icon,
    initialData: {},
  },
  {
    type: "videoEmbed",
    label: videoMeta.label,
    icon: videoMeta.icon,
    initialData: {
      title: "",
      url: "",
      source: "",
      refId: "",
      startTime: "",
      endTime: "",
      isOpen: true,
    },
  },
];