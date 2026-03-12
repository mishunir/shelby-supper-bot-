import "dotenv/config"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createServer } from "node:http"
import {
	Account,
	AccountAddress,
	Ed25519PrivateKey,
	Network,
} from "@aptos-labs/ts-sdk"
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node"
import { filesize } from "filesize"

const SHELBY_ACCOUNT_ADDRESS = process.env.SHELBY_ACCOUNT_ADDRESS
const SHELBY_ACCOUNT_PRIVATE_KEY = process.env.SHELBY_ACCOUNT_PRIVATE_KEY
const SHELBY_API_KEY = process.env.SHELBY_API_KEY
const PORT = Number(process.env.PORT) || 3001

if (!SHELBY_ACCOUNT_ADDRESS || !SHELBY_ACCOUNT_PRIVATE_KEY || !SHELBY_API_KEY) {
	console.error("Missing .env: SHELBY_ACCOUNT_ADDRESS, SHELBY_ACCOUNT_PRIVATE_KEY, SHELBY_API_KEY")
	process.exit(1)
}

const client = new ShelbyNodeClient({
	network: Network.SHELBYNET,
	apiKey: SHELBY_API_KEY,
})
const signer = Account.fromPrivateKey({
	privateKey: new Ed25519PrivateKey(SHELBY_ACCOUNT_PRIVATE_KEY),
})
const account = AccountAddress.fromString(SHELBY_ACCOUNT_ADDRESS)

const MIME_JSON = { "Content-Type": "application/json" }

async function handleList(): Promise<{ ok: boolean; blobs?: unknown[]; error?: string }> {
	try {
		const blobs = await client.coordination.getAccountBlobs({ account })
		return {
			ok: true,
			blobs: blobs.map((b) => ({
				name: b.name,
				size: b.size,
				sizeFormatted: filesize(b.size),
				expirationMicros: b.expirationMicros,
				expiry: new Date(b.expirationMicros / 1000).toLocaleString(),
			})),
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		return { ok: false, error: msg }
	}
}

async function handleUpload(
	blobName: string,
	blobData: Buffer,
	durationMicros: number,
): Promise<{ ok: boolean; error?: string }> {
	try {
		await client.upload({
			blobData,
			signer,
			blobName,
			expirationMicros: Date.now() * 1000 + durationMicros,
		})
		return { ok: true }
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		return { ok: false, error: msg }
	}
}

async function handleDownload(blobName: string): Promise<Buffer | { ok: false; error: string }> {
	try {
		const download = await client.download({ account, blobName })
		const chunks: Uint8Array[] = []
		const stream = download.readable as ReadableStream<Uint8Array>
		const reader = stream.getReader()
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			if (value) chunks.push(value)
		}
		const total = chunks.reduce((a, c) => a + c.length, 0)
		const buf = Buffer.alloc(total)
		let offset = 0
		for (const c of chunks) {
			buf.set(c, offset)
			offset += c.length
		}
		return buf
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		return { ok: false, error: msg }
	}
}

function parseBody(req: import("node:http").IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		req.on("data", (c) => chunks.push(c))
		req.on("end", () => resolve(Buffer.concat(chunks).toString()))
		req.on("error", reject)
	})
}

const server = createServer(async (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	res.setHeader("Access-Control-Allow-Headers", "Content-Type")

	if (req.method === "OPTIONS") {
		res.writeHead(204)
		res.end()
		return
	}

	const url = new URL(req.url || "/", `http://localhost:${PORT}`)
	const path = url.pathname

	if (path === "/" || path === "/index.html") {
		const html = readFileSync(join(process.cwd(), "index.html"), "utf8")
		res.writeHead(200, { "Content-Type": "text/html" })
		res.end(html)
		return
	}

	if (path === "/api/list" && req.method === "GET") {
		const result = await handleList()
		res.writeHead(200, MIME_JSON)
		res.end(JSON.stringify(result))
		return
	}

	if (path === "/api/upload" && req.method === "POST") {
		const body = await parseBody(req)
		let parsed: { blobName: string; blobDataBase64: string; durationMicros?: number }
		try {
			parsed = JSON.parse(body)
		} catch {
			res.writeHead(400, MIME_JSON)
			res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }))
			return
		}
		const blobData = Buffer.from(parsed.blobDataBase64, "base64")
		const durationMicros = parsed.durationMicros ?? 60 * 60 * 1_000_000
		if (!blobData.length || !parsed.blobName) {
			res.writeHead(400, MIME_JSON)
			res.end(JSON.stringify({ ok: false, error: "Missing file or blob name" }))
			return
		}
		const result = await handleUpload(parsed.blobName, blobData, durationMicros)
		res.writeHead(200, MIME_JSON)
		res.end(JSON.stringify(result))
		return
	}

	if (path === "/api/download" && req.method === "GET") {
		const blobName = url.searchParams.get("name")
		if (!blobName) {
			res.writeHead(400, MIME_JSON)
			res.end(JSON.stringify({ ok: false, error: "Missing blob name" }))
			return
		}
		const result = await handleDownload(blobName)
		if (Buffer.isBuffer(result)) {
			res.writeHead(200, {
				"Content-Type": "application/octet-stream",
				"Content-Disposition": `attachment; filename="${blobName}"`,
			})
			res.end(result)
		} else {
			res.writeHead(400, MIME_JSON)
			res.end(JSON.stringify(result))
		}
		return
	}

	res.writeHead(404)
	res.end()
})

server.listen(PORT, () => {
	console.log(`Shelby UI running at http://localhost:${PORT}`)
})
