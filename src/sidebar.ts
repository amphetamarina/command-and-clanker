export const SIDEBAR_FRACTION = 0.4;
const PANEL_PAD = 12;

type SidebarOptions = {
  onBuildTerminal: () => void;
};

export class Sidebar {
  readonly terminalHost: HTMLDivElement;
  private tabs: HTMLDivElement;

  constructor(private opts: SidebarOptions) {
    const root = document.createElement("div");
    root.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      `width:${SIDEBAR_FRACTION * 100}vw`,
      "height:100%",
      "box-sizing:border-box",
      `padding:${PANEL_PAD}px`,
      "display:flex",
      "flex-direction:column",
      "gap:10px",
      "background:linear-gradient(#15151f,#101019)",
      "border-right:2px solid #2c2c44",
      "box-shadow:4px 0 16px rgba(0,0,0,0.5)",
      "font-family:'JetBrains Mono',ui-monospace,monospace",
      "color:#d8d8ec",
      "font-size:13px",
      "z-index:50",
    ].join(";");

    const header = document.createElement("div");
    header.style.cssText =
      "display:flex;align-items:center;gap:12px;flex:none";
    const title = document.createElement("div");
    title.textContent = "ISOTOP";
    title.style.cssText = "letter-spacing:4px;font-size:17px;color:#6bb6ff";
    const buildBtn = document.createElement("button");
    buildBtn.style.cssText = [
      "display:flex",
      "align-items:center",
      "gap:8px",
      "padding:6px 12px",
      "background:#16263a",
      "color:#7fe0d0",
      "border:1px solid #2c4a5a",
      "border-radius:4px",
      "font-family:inherit",
      "font-size:13px",
      "cursor:pointer",
    ].join(";");
    buildBtn.append(this.icon(20), this.span("+ Terminal"));
    buildBtn.addEventListener("click", () => this.opts.onBuildTerminal());
    header.append(title, buildBtn);

    this.tabs = document.createElement("div");
    this.tabs.style.cssText =
      "display:flex;flex-wrap:wrap;gap:6px;flex:none;min-height:0";

    this.terminalHost = document.createElement("div");
    this.terminalHost.style.cssText = [
      "flex:1",
      "min-height:0",
      "background:#0b0b14",
      "border:1px solid #2c2c44",
      "border-radius:5px",
      "overflow:auto",
      "padding:6px",
    ].join(";");

    root.append(header, this.tabs, this.terminalHost);
    document.body.appendChild(root);
  }

  private span(text: string): HTMLSpanElement {
    const el = document.createElement("span");
    el.textContent = text;
    return el;
  }

  private icon(size: number): HTMLImageElement {
    const img = document.createElement("img");
    img.src = "/isotop-assets/sci-fi/icons/terminal.png";
    img.width = size;
    img.height = size;
    img.style.cssText = "image-rendering:pixelated;flex:none";
    return img;
  }

  setTerminals(
    ids: string[],
    activeId: string | null,
    onOpen: (id: string) => void,
    onClose: (id: string) => void,
  ): void {
    this.tabs.replaceChildren();
    for (const id of ids) {
      const active = id === activeId;
      const tab = document.createElement("div");
      tab.style.cssText = [
        "display:flex",
        "align-items:center",
        "gap:6px",
        "padding:4px 8px",
        `background:${active ? "#23344a" : "#15151f"}`,
        `border:1px solid ${active ? "#3a6a8a" : "#2c2c44"}`,
        "border-radius:4px",
        `color:${active ? "#cfeaff" : "#9a9ab5"}`,
        "font-size:13px",
        "cursor:pointer",
      ].join(";");
      const label = this.span(id);
      label.style.cursor = "pointer";
      label.addEventListener("click", () => onOpen(id));
      const close = this.span("×");
      close.style.cssText = "cursor:pointer;color:#ff8a7a;font-weight:bold";
      close.addEventListener("click", (e) => {
        e.stopPropagation();
        onClose(id);
      });
      tab.append(this.icon(16), label, close);
      this.tabs.appendChild(tab);
    }
  }
}
