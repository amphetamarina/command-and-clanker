export const SIDEBAR_W = 220;
const PANEL_PAD = 12;

type SidebarOptions = {
  onBuildTerminal: () => void;
};

export class Sidebar {
  private termList: HTMLDivElement;
  private termEmpty: HTMLDivElement;

  constructor(private opts: SidebarOptions) {
    const root = document.createElement("div");
    root.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      `width:${SIDEBAR_W}px`,
      "height:100%",
      "box-sizing:border-box",
      `padding:${PANEL_PAD}px`,
      "background:linear-gradient(#15151f,#101019)",
      "border-right:2px solid #2c2c44",
      "box-shadow:4px 0 16px rgba(0,0,0,0.5)",
      "font-family:'JetBrains Mono',ui-monospace,monospace",
      "color:#d8d8ec",
      "font-size:13px",
      "z-index:50",
      "user-select:none",
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "ISOTOP";
    title.style.cssText =
      "letter-spacing:4px;font-size:17px;color:#6bb6ff;text-align:center;margin-bottom:14px";

    const buildSection = document.createElement("div");
    buildSection.append(this.sectionLabel("BUILD"));
    const termBtn = document.createElement("button");
    termBtn.style.cssText = [
      "display:flex",
      "align-items:center",
      "gap:10px",
      "width:100%",
      "padding:8px 10px",
      "background:#16263a",
      "color:#7fe0d0",
      "border:1px solid #2c4a5a",
      "border-radius:4px",
      "font-family:inherit",
      "font-size:13px",
      "text-align:left",
      "cursor:pointer",
    ].join(";");
    termBtn.append(this.icon(28), this.span("Terminal"));
    termBtn.addEventListener("click", () => this.opts.onBuildTerminal());
    buildSection.appendChild(termBtn);

    const termSection = document.createElement("div");
    termSection.style.cssText = "margin-top:16px";
    termSection.append(this.sectionLabel("TERMINALS"));
    this.termList = document.createElement("div");
    this.termList.style.cssText = "display:flex;flex-direction:column;gap:4px";
    this.termEmpty = document.createElement("div");
    this.termEmpty.textContent = "none running";
    this.termEmpty.style.cssText = "color:#5a5a78;font-size:12px";
    termSection.append(this.termList, this.termEmpty);

    root.append(title, buildSection, termSection);
    document.body.appendChild(root);
  }

  private sectionLabel(text: string): HTMLDivElement {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText =
      "color:#7a7a95;letter-spacing:2px;font-size:12px;margin-bottom:6px";
    return el;
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

  setTerminals(ids: string[], onOpen: (id: string) => void): void {
    this.termList.replaceChildren();
    this.termEmpty.style.display = ids.length ? "none" : "block";
    for (const id of ids) {
      const row = document.createElement("button");
      row.style.cssText = [
        "display:flex",
        "align-items:center",
        "gap:8px",
        "width:100%",
        "padding:5px 8px",
        "background:#15151f",
        "color:#cfcfe6",
        "border:1px solid #2c2c44",
        "border-radius:4px",
        "font-family:inherit",
        "font-size:13px",
        "text-align:left",
        "cursor:pointer",
      ].join(";");
      row.append(this.icon(18), this.span(id));
      row.addEventListener("click", () => onOpen(id));
      this.termList.appendChild(row);
    }
  }
}
