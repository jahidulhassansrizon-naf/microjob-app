import net from "net";
import tls from "tls";
import crypto from "crypto";

/**
 * Small dependency-free SMTP client (Node built-ins only: net + tls).
 * Supports implicit TLS (port 465), STARTTLS (port 587), AUTH PLAIN / LOGIN,
 * and sending many mails over one connection.
 */

export type SmtpClientOptions = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  timeoutMs?: number;
};

export type SmtpMessage = {
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type Reply = { code: number; lines: string[] };

const CLIENT_NAME = "sebalagbe.com";
const isLocalHost = (host: string) => host === "localhost" || host === "127.0.0.1" || host === "::1";
const noBreaks = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

function makeError(message: string, code?: string) {
  const error = new Error(message) as Error & { code?: string };
  if (code) error.code = code;
  return error;
}

function encodeHeader(value: string): string {
  const clean = noBreaks(value);
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${Buffer.from(clean, "utf8").toString("base64")}?=`;
}

function formatAddress(email: string, name?: string): string {
  const address = `<${noBreaks(email)}>`;
  if (!name) return address;
  const clean = noBreaks(name).replace(/["\\]/g, "");
  // eslint-disable-next-line no-control-regex
  const display = /^[\x20-\x7e]*$/.test(clean) ? `"${clean}"` : encodeHeader(clean);
  return `${display} ${address}`;
}

function base64Lines(value: string): string {
  const b64 = Buffer.from(value, "utf8").toString("base64");
  return (b64.match(/.{1,76}/g) || [""]).join("\r\n");
}

export function buildMimeMessage(message: SmtpMessage): string {
  const boundary = `=_sl_${crypto.randomBytes(12).toString("hex")}`;
  const domain = (message.fromEmail.split("@")[1] || CLIENT_NAME).replace(/[^a-zA-Z0-9.-]/g, "");
  const headers = [
    `From: ${formatAddress(message.fromEmail, message.fromName)}`,
    `To: <${noBreaks(message.to)}>`,
    ...(message.replyTo ? [`Reply-To: <${noBreaks(message.replyTo)}>`] : []),
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomBytes(16).toString("hex")}@${domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const parts = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(message.text),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64Lines(message.html),
    `--${boundary}--`,
    "",
  ];
  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`;
}

export class SmtpSession {
  private socket!: net.Socket | tls.TLSSocket;
  private lines: string[] = [];
  private partial = "";
  private waiter: { resolve: () => void; reject: (e: Error) => void } | null = null;
  private failure: Error | null = null;
  private capabilities: string[] = [];
  private readonly timeoutMs: number;

  private constructor(private readonly options: SmtpClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  static async connect(options: SmtpClientOptions): Promise<SmtpSession> {
    const session = new SmtpSession(options);
    try {
      await session.open();
    } catch (error) {
      session.destroy();
      throw error;
    }
    return session;
  }

  // ---- socket plumbing ----------------------------------------------------
  private attach(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    this.lines = [];
    this.partial = "";
    socket.setEncoding("utf8");
    socket.setTimeout(this.timeoutMs * 2);
    socket.on("data", (chunk: string) => {
      this.partial += chunk;
      const parts = this.partial.split("\r\n");
      this.partial = parts.pop() ?? "";
      for (const line of parts) if (line) this.lines.push(line);
      this.wake();
    });
    socket.on("error", (error) => this.fail(error as Error));
    socket.on("timeout", () => this.fail(makeError("SMTP connection timed out.", "ETIMEDOUT")));
    socket.on("close", () => this.fail(makeError("SMTP connection closed unexpectedly.", "ECONNRESET")));
  }

  private fail(error: Error) {
    if (!this.failure) this.failure = error;
    const waiter = this.waiter;
    this.waiter = null;
    waiter?.reject(this.failure);
  }

  private wake() {
    const waiter = this.waiter;
    this.waiter = null;
    waiter?.resolve();
  }

  private waitForData(): Promise<void> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(makeError("SMTP server did not respond in time.", "ETIMEDOUT"));
      }, this.timeoutMs);
      this.waiter = {
        resolve: () => {
          clearTimeout(timer);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
    });
  }

  private async readReply(): Promise<Reply> {
    const collected: string[] = [];
    for (;;) {
      while (this.lines.length === 0) await this.waitForData();
      const line = this.lines.shift() as string;
      collected.push(line);
      const match = /^(\d{3})([ -])/.exec(line);
      if (match && match[2] === " ") return { code: Number(match[1]), lines: collected };
      if (!match) continue;
    }
  }

  private write(data: string) {
    if (this.failure) throw this.failure;
    this.socket.write(data);
  }

  private async command(line: string, expected: number[]): Promise<Reply> {
    this.write(`${line}\r\n`);
    const reply = await this.readReply();
    if (!expected.includes(reply.code)) {
      throw makeError(`${reply.code} ${reply.lines.map((l) => l.slice(4)).join(" ").slice(0, 200)}`.trim());
    }
    return reply;
  }

  // ---- protocol -----------------------------------------------------------
  private async open() {
    const { host, port, secure } = this.options;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(makeError("Could not connect to the SMTP server in time.", "ETIMEDOUT")), this.timeoutMs);
      const socket = secure
        ? tls.connect({ host, port, servername: isLocalHost(host) ? undefined : host })
        : net.connect({ host, port });
      this.attach(socket);
      socket.once(secure ? "secureConnect" : "connect", () => {
        clearTimeout(timer);
        resolve();
      });
      socket.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });

    const greeting = await this.readReply();
    if (greeting.code !== 220) throw makeError(`${greeting.code} ${greeting.lines.join(" ").slice(0, 200)}`);

    await this.ehlo();

    if (!secure) {
      if (this.capabilities.some((c) => c.startsWith("STARTTLS"))) {
        await this.command("STARTTLS", [220]);
        const plain = this.socket;
        plain.removeAllListeners("data");
        plain.removeAllListeners("error");
        plain.removeAllListeners("timeout");
        plain.removeAllListeners("close");
        const upgraded = tls.connect({ socket: plain, servername: isLocalHost(host) ? undefined : host });
        this.attach(upgraded);
        await new Promise<void>((resolve, reject) => {
          upgraded.once("secureConnect", () => resolve());
          upgraded.once("error", reject);
        });
        await this.ehlo();
      } else if (!isLocalHost(host)) {
        throw makeError("The SMTP server does not support an encrypted connection. Use port 465 with SSL on.");
      }
    }

    await this.authenticate();
  }

  private async ehlo() {
    const reply = await this.command(`EHLO ${CLIENT_NAME}`, [250]);
    this.capabilities = reply.lines.slice(1).map((l) => l.slice(4).toUpperCase());
  }

  private async authenticate() {
    const { username, password } = this.options;
    const authLine = this.capabilities.find((c) => c.startsWith("AUTH ")) || "";
    if (authLine.includes("PLAIN") || !authLine) {
      const token = Buffer.from(`\u0000${username}\u0000${password}`, "utf8").toString("base64");
      await this.command(`AUTH PLAIN ${token}`, [235]);
    } else {
      await this.command("AUTH LOGIN", [334]);
      await this.command(Buffer.from(username, "utf8").toString("base64"), [334]);
      await this.command(Buffer.from(password, "utf8").toString("base64"), [235]);
    }
  }

  async send(message: SmtpMessage): Promise<{ messageId?: string }> {
    const mime = buildMimeMessage(message);
    await this.command(`MAIL FROM:<${noBreaks(message.fromEmail)}>`, [250]);
    try {
      await this.command(`RCPT TO:<${noBreaks(message.to)}>`, [250, 251]);
      await this.command("DATA", [354]);
    } catch (error) {
      await this.command("RSET", [250]).catch(() => undefined);
      throw error;
    }
    this.write(`${mime}\r\n.\r\n`);
    const reply = await this.readReply();
    if (reply.code !== 250) throw makeError(`${reply.code} ${reply.lines.map((l) => l.slice(4)).join(" ").slice(0, 200)}`);
    const id = /^Message-ID:\s*(.+)$/im.exec(mime)?.[1]?.trim();
    return { messageId: id };
  }

  get alive() {
    return !this.failure && !this.socket.destroyed;
  }

  async close() {
    try {
      if (this.alive) this.socket.write("QUIT\r\n");
    } catch {
      // ignore
    }
    this.destroy();
  }

  private destroy() {
    try {
      this.socket?.destroy();
    } catch {
      // ignore
    }
  }
}
