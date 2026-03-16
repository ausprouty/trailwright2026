import "../shared/blockHeader.css";
import "./CollapsibleTextTool.css";

type CollapsibleTextData = {
  body: string;
  heading: string;
  isOpen: boolean;
};

type EditorJSToolConstructorArgs = {
  api: unknown;
  config?: Record<string, unknown>;
  data?: Partial<CollapsibleTextData>;
  readOnly?: boolean;
};

export default class CollapsibleTextTool {
  private data: CollapsibleTextData;

  private readOnly: boolean;

  private bodyEditor!: HTMLDivElement;

  private bodyWrap!: HTMLDivElement;

  private headingInput!: HTMLInputElement;

  private headerRow!: HTMLDivElement;

  private toggleSymbol!: HTMLSpanElement;

  private wrapper!: HTMLDivElement;

  constructor({
    data,
    readOnly = false,
  }: EditorJSToolConstructorArgs) {
    this.readOnly = readOnly;

    this.data = {
      heading: data?.heading || "",
      isOpen: data?.isOpen ?? true,
      body: data?.body || "<p><br></p>",
    };
  }

  public static get sanitize() {
    return {
      body: {
        a: {
          href: true,
          rel: true,
          target: true,
        },
        b: true,
        blockquote: true,
        br: true,
        em: true,
        i: true,
        li: true,
        ol: true,
        p: true,
        strong: true,
        u: true,
        ul: true,
      },
      heading: {},
      isOpen: {},
    };
  }

  public static get toolbox() {
    return {
      title: "Collapsible Text",
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16v3H4V6zm0 9h16v3H4v-3z"
            fill="currentColor"
          />
        </svg>
      `,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "collapsible-text";

    this.headerRow = document.createElement("div");
    this.headerRow.className =
      "collapsible-text__header tool-header";
    this.headerRow.addEventListener("click", this.onHeaderClick);

    const headerLeft = document.createElement("div");
    headerLeft.className =
      "collapsible-text__header-left tool-header__left";

    this.headingInput = document.createElement("input");
    this.headingInput.type = "text";
    this.headingInput.className =
      "collapsible-text__heading tool-header__text";
    this.headingInput.placeholder = "Heading";
    this.headingInput.value = this.data.heading;
    this.headingInput.readOnly = this.readOnly;

    this.headingInput.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    this.headingInput.addEventListener("keydown", (event) => {
      event.stopPropagation();
    });

    this.headingInput.addEventListener("input", () => {
      this.data.heading = this.headingInput.value;
    });

    const headerRight = document.createElement("div");
    headerRight.className =
      "collapsible-text__header-right tool-header__right";

    this.toggleSymbol = document.createElement("span");
    this.toggleSymbol.className =
      "collapsible-text__toggle tool-header__toggle";
    this.toggleSymbol.setAttribute("aria-hidden", "true");

    headerLeft.appendChild(this.headingInput);
    headerRight.appendChild(this.toggleSymbol);

    this.headerRow.appendChild(headerLeft);
    this.headerRow.appendChild(headerRight);

    this.bodyWrap = document.createElement("div");
    this.bodyWrap.className = "collapsible-text__body-wrap";

    this.bodyEditor = document.createElement("div");
    this.bodyEditor.className = "collapsible-text__body";
    this.bodyEditor.contentEditable = this.readOnly ? "false" : "true";
    this.bodyEditor.innerHTML = this.normalizeBodyHtml(this.data.body);

    this.bodyEditor.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    this.bodyEditor.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });

    this.bodyEditor.addEventListener("focus", () => {
      this.ensureParagraphStructure();
    });

    this.bodyEditor.addEventListener("input", () => {
      this.data.body = this.bodyEditor.innerHTML;
    });

    this.bodyEditor.addEventListener("keydown", (event) => {
      this.onBodyKeyDown(event);
    });

    this.bodyWrap.appendChild(this.bodyEditor);

    this.wrapper.appendChild(this.headerRow);
    this.wrapper.appendChild(this.bodyWrap);

    this.syncOpenState();

    return this.wrapper;
  }

  public save(): CollapsibleTextData {
    return {
      body: this.normalizeBodyHtml(
        this.bodyEditor.innerHTML.replace(/\u200B/g, "")
      ),
      heading: this.headingInput.value.trim(),
      isOpen: this.data.isOpen,
    };
  }

  private ensureParagraphStructure(): void {
    if (this.readOnly) {
      return;
    }

    const html = this.bodyEditor.innerHTML.trim();

    if (!html || html === "<br>") {
      this.bodyEditor.innerHTML = "<p><br></p>";
      this.placeCaretInsideLastParagraph();
      this.data.body = this.bodyEditor.innerHTML.replace(/\u200B/g, "");
      return;
    }

    const hasParagraph = this.bodyEditor.querySelector("p");

    if (!hasParagraph) {
      const text = this.bodyEditor.textContent || "";
      this.bodyEditor.innerHTML =
        `<p>${this.escapeHtml(text) || "<br>"}</p>`;
      this.placeCaretInsideLastParagraph();
      this.data.body = this.bodyEditor.innerHTML;
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private normalizeBodyHtml(html: string): string {
    const trimmed = html.trim();

    if (!trimmed || trimmed === "<br>") {
      return "<p><br></p>";
    }

    return trimmed;
  }

  private onBodyKeyDown(event: KeyboardEvent): void {
    if (this.readOnly) {
      return;
    }

    event.stopPropagation();

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation?.();

    this.ensureParagraphStructure();
    this.insertParagraphAtCursor();
    this.data.body = this.bodyEditor.innerHTML;
  }

  private onHeaderClick = (): void => {
    if (this.readOnly) {
      return;
    }

    this.data.isOpen = !this.data.isOpen;
    this.syncOpenState();
  };

  

  private insertParagraphAtCursor(): void {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      this.appendEmptyParagraph();
      return;
    }

    const range = selection.getRangeAt(0);

    if (!this.bodyEditor.contains(range.startContainer)) {
      this.appendEmptyParagraph();
      return;
    }

    const currentParagraph = this.findParentParagraph(
      range.startContainer
    );

    if (!currentParagraph) {
      this.appendEmptyParagraph();
      return;
    }

    const newParagraph = document.createElement("p");

    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const fullText = textNode.textContent || "";
      const offset = range.startOffset;

      const beforeText = fullText.slice(0, offset);
      const afterText = fullText.slice(offset);

      textNode.textContent = beforeText;

      if (afterText.length > 0) {
        newParagraph.appendChild(
          document.createTextNode(afterText)
        );
      } else {
        newParagraph.appendChild(
          document.createTextNode("\u200B")
        );
      }

      let sibling = textNode.nextSibling;

      while (sibling) {
        const nextSibling = sibling.nextSibling;
        newParagraph.appendChild(sibling);
        sibling = nextSibling;
      }
    } else {
      const afterRange = range.cloneRange();
      afterRange.setEndAfter(currentParagraph);

      const fragment = afterRange.extractContents();

      if (fragment.childNodes.length > 0) {
        newParagraph.appendChild(fragment);
      } else {
        newParagraph.appendChild(
          document.createTextNode("\u200B")
        );
      }
    }

    this.cleanupParagraph(currentParagraph);
    this.cleanupParagraph(newParagraph);

    if (currentParagraph.parentNode) {
      currentParagraph.parentNode.insertBefore(
        newParagraph,
        currentParagraph.nextSibling
      );
      this.placeCaretInsideParagraph(newParagraph, true);
      return;
    }

    this.appendEmptyParagraph();
  }
  

  private findParentParagraph(
    node: Node | null
  ): HTMLParagraphElement | null {
    let current: Node | null = node;

    while (current && current !== this.bodyEditor) {
      if (
        current.nodeType === Node.ELEMENT_NODE &&
        (current as HTMLElement).tagName === "P"
      ) {
        return current as HTMLParagraphElement;
      }

      current = current.parentNode;
    }

    return null;
  }

  private cleanupParagraph(paragraph: HTMLParagraphElement): void {
    const text = (paragraph.textContent || "")
      .replace(/\u200B/g, "")
      .trim();

    if (!text && paragraph.childNodes.length === 0) {
      paragraph.innerHTML = "";
      paragraph.appendChild(document.createTextNode("\u200B"));
      return;
    }

    if (!text && paragraph.innerHTML.trim() === "") {
      paragraph.innerHTML = "";
      paragraph.appendChild(document.createTextNode("\u200B"));
    }
  }

  private appendEmptyParagraph(): void {
    const paragraph = document.createElement("p");
    paragraph.appendChild(document.createTextNode("\u200B"));
    this.bodyEditor.appendChild(paragraph);
    this.placeCaretInsideParagraph(paragraph, true);
  }

  private placeCaretInsideParagraph(
    paragraph: HTMLParagraphElement,
    atStart: boolean
  ): void {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    if (
      !paragraph.firstChild ||
      paragraph.firstChild.nodeType !== Node.TEXT_NODE
    ) {
      paragraph.innerHTML = "";
      paragraph.appendChild(document.createTextNode("\u200B"));
    }

    const textNode = paragraph.firstChild as Text;
    const textLength = textNode.textContent
      ? textNode.textContent.length
      : 0;

    const range = document.createRange();
    range.setStart(textNode, atStart ? 0 : textLength);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }
 



  private placeCaretInsideLastParagraph(): void {
    const selection = window.getSelection();
    const paragraphs = this.bodyEditor.querySelectorAll("p");
    const lastParagraph = paragraphs[paragraphs.length - 1];

    if (!selection || !lastParagraph) {
      return;
    }

    this.placeCaretInsideParagraph(lastParagraph, false);
  }

  

  private syncOpenState(): void {
    this.toggleSymbol.textContent = this.data.isOpen ? "−" : "+";
    this.bodyWrap.style.display = this.data.isOpen ? "block" : "none";
    this.wrapper.dataset.open = this.data.isOpen ? "true" : "false";
  }
}