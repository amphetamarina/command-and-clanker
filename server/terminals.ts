const OUTPUT_BUFFER_CAP = 16384;

export type TermClient = { send: (data: string) => void };

class Terminal {
  readonly id: string;
  private proc: ReturnType<typeof Bun.spawn>;
  private buffer = "";
  private clients = new Set<TermClient>();

  constructor(id: string, onExit: () => void) {
    this.id = id;
    const shell = process.env.SHELL ?? "bash";
    this.proc = Bun.spawn(["script", "-qfc", `exec ${shell} -i`, "/dev/null"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
      env: { ...process.env, TERM: "xterm-256color" },
      onExit: () => onExit(),
    });
    void this.pump();
  }

  private async pump() {
    const reader = (this.proc.stdout as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      this.buffer = (this.buffer + text).slice(-OUTPUT_BUFFER_CAP);
      for (const client of this.clients) client.send(text);
    }
  }

  attach(client: TermClient) {
    if (this.buffer) client.send(this.buffer);
    this.clients.add(client);
  }

  detach(client: TermClient) {
    this.clients.delete(client);
  }

  write(data: string) {
    const sink = this.proc.stdin as { write: (d: string) => void; flush: () => void };
    sink.write(data);
    sink.flush();
  }

  kill() {
    try {
      this.proc.kill();
    } catch {
      // already gone
    }
  }
}

export class TerminalManager {
  private terminals = new Map<string, Terminal>();
  private seq = 0;

  create(): string {
    const id = `t${++this.seq}`;
    this.terminals.set(
      id,
      new Terminal(id, () => this.terminals.delete(id)),
    );
    return id;
  }

  get(id: string): Terminal | undefined {
    return this.terminals.get(id);
  }

  list(): string[] {
    return [...this.terminals.keys()];
  }

  kill(id: string) {
    this.terminals.get(id)?.kill();
    this.terminals.delete(id);
  }
}
