import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
//#region src/home.ts
/** First non-blank string in a list of candidate values. */
function firstNonBlank(...values) {
	for (const value of values) if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed !== "") return trimmed;
	}
}
/**
* Resolve the DSH harness home exactly like the dsh launcher:
*  - an injected `home` option (tests pass a throwaway HOME) maps to
*    `<home>/.dsh`;
*  - otherwise a trimmed non-empty `$DSH_HOME` is the harness home directly;
*  - otherwise the harness home derived from this package's install layout;
*  - otherwise `homedir()/.dsh`.
* @param optsHome - injectable HOME (tests); default resolves from env/homedir.
* @param env - environment map (defaults to process.env).
* @param installHome - harness home from resolveInstallLayout (no suffix).
*/
function resolveHarnessHome(optsHome, env = process.env, installHome) {
	if (optsHome !== void 0) return join(optsHome, ".dsh");
	return firstNonBlank(env.DSH_HOME, installHome) ?? join(homedir(), ".dsh");
}
/** The photo-skins import store root: <harnessHome>/photo-skins. */
function defaultPhotoSkinsStoreDir(home) {
	return join(home, "photo-skins");
}
//#endregion
//#region src/mount-once.ts
/**
* Host single-instance guard for the photo-skins plugin. The registry rides a
* global symbol so two module instances of the same package (npm copy vs
* repository link) still share one verdict; the second host apply is a no-op
* for the lifetime of the first instance. See THIRD_PARTY_NOTICES.md.
*/
const MOUNTED = Symbol.for("dsh-photo-skins.mounted-plugins");
function mountedSet() {
	const registry = globalThis;
	return registry[MOUNTED] ??= /* @__PURE__ */ new Set();
}
/**
* Wrap a cordis plugin apply so the package runs at most once per process.
* The first mount registers normally and unmarks when its fiber disposes;
* any later mount of the same package name is a no-op.
* @param packageName - npm package identity shared by every install source.
* @param fn - the original plugin apply.
* @returns an apply of the same shape.
*/
function mountOnce(packageName, fn) {
	return ((...args) => {
		const mounted = mountedSet();
		if (mounted.has(packageName)) return;
		mounted.add(packageName);
		args[0]?.effect?.(() => () => {
			mounted.delete(packageName);
		});
		return fn(...args);
	});
}
//#endregion
//#region src/library.ts
/**
* Photo import store for the photo-skins plugin (host half). Each imported
* photo lives in <store>/<id>/ as `original.<ext>` plus a manifest.json
* recording the display name, detected image type, size and import time.
* The id is generated here and validated against a whitelist regex before
* any path use, so a crafted request can never walk outside the store tree.
* Everything is plain data and pure filesystem reads — injectable for tests.
* @module dsh-photo-skins/library
*/
/** Legal stored-photo id shape. */
const PHOTO_ID_RE = /^[a-z0-9][a-z0-9-]{6,38}$/;
/** Supported raster types: mime, file extension and magic-byte probe. */
const PHOTO_TYPES = [
	{
		type: "png",
		mime: "image/png",
		ext: "png",
		isHead: (head) => head.length >= 8 && head[0] === 137 && head[1] === 80 && head[2] === 78 && head[3] === 71 && head[4] === 13 && head[5] === 10 && head[6] === 26 && head[7] === 10
	},
	{
		type: "jpeg",
		mime: "image/jpeg",
		ext: "jpg",
		isHead: (head) => head.length >= 3 && head[0] === 255 && head[1] === 216 && head[2] === 255
	},
	{
		type: "webp",
		mime: "image/webp",
		ext: "webp",
		isHead: (head) => head.length >= 12 && head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP"
	},
	{
		type: "gif",
		mime: "image/gif",
		ext: "gif",
		isHead: (head) => head.length >= 6 && (head.toString("ascii", 0, 6) === "GIF87a" || head.toString("ascii", 0, 6) === "GIF89a")
	}
];
/** Detect the raster type from a file head, or null when unsupported. */
function detectPhotoType(head) {
	for (const entry of PHOTO_TYPES) if (entry.isHead(head)) return entry.type;
	return null;
}
/** Look up a photo type's static record. */
function photoTypeRecord(type) {
	const record = PHOTO_TYPES.find((entry) => entry.type === type);
	if (record === void 0) throw new Error(`unknown photo type: ${type}`);
	return record;
}
/** Read a photo dir's manifest.json; null when missing or malformed. */
function readPhotoManifest(dir) {
	let raw;
	try {
		raw = readFileSync(join(dir, "manifest.json"), "utf8");
	} catch {
		return null;
	}
	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		const record = parsed;
		if (typeof record.id !== "string" || !PHOTO_ID_RE.test(record.id)) return null;
		if (typeof record.name !== "string") return null;
		if (record.type !== "png" && record.type !== "jpeg" && record.type !== "webp" && record.type !== "gif") return null;
		if (typeof record.bytes !== "number" || !Number.isFinite(record.bytes)) return null;
		if (typeof record.importedAt !== "number" || !Number.isFinite(record.importedAt)) return null;
		return {
			id: record.id,
			name: record.name,
			type: record.type,
			bytes: record.bytes,
			importedAt: record.importedAt
		};
	} catch {
		return null;
	}
}
/**
* Enumerate the import store. Directories without a valid manifest.json
* (or whose original file is gone) are skipped — never thrown over.
* @param storeDir - the import-store root.
* @returns entries ordered by import time (oldest first).
*/
function listPhotos(storeDir) {
	let entries;
	try {
		entries = readdirSync(storeDir);
	} catch {
		return [];
	}
	const out = [];
	for (const name of entries) {
		if (!PHOTO_ID_RE.test(name)) continue;
		const dir = join(storeDir, name);
		if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
		const manifest = readPhotoManifest(dir);
		if (manifest === null || manifest.id !== name) continue;
		const record = photoTypeRecord(manifest.type);
		const fileAbs = join(dir, "original." + record.ext);
		if (!existsSync(fileAbs)) continue;
		out.push({
			...manifest,
			fileAbs
		});
	}
	out.sort((a, b) => a.importedAt - b.importedAt);
	return out;
}
/** Resolve a stored photo by id; null when unknown or unreadable. */
function findPhoto(storeDir, id) {
	if (!PHOTO_ID_RE.test(id)) return null;
	const dir = join(storeDir, id);
	const manifest = readPhotoManifest(dir);
	if (manifest === null || manifest.id !== id) return null;
	const record = photoTypeRecord(manifest.type);
	const fileAbs = join(dir, "original." + record.ext);
	if (!existsSync(fileAbs)) return null;
	return {
		...manifest,
		fileAbs
	};
}
/** Generate a fresh store id (timestamp base36 + random base36). */
function newPhotoId(now = Date.now(), random = () => Math.random().toString(36).slice(2, 8)) {
	return now.toString(36) + "-" + random();
}
/** Persist one imported photo into <store>/<id>/, atomically (tmp + rename). */
function writePhoto(storeDir, id, type, bytes, name, importedAt = Date.now()) {
	const record = photoTypeRecord(type);
	const dir = join(storeDir, id);
	mkdirSync(dir, { recursive: true });
	const tmp = join(dir, "original." + record.ext + ".tmp");
	writeFileSync(tmp, bytes);
	renameSync(tmp, join(dir, "original." + record.ext));
	const manifest = {
		id,
		name,
		type,
		bytes: bytes.length,
		importedAt
	};
	const manifestTmp = join(dir, "manifest.json.tmp");
	writeFileSync(manifestTmp, JSON.stringify(manifest, null, 2), "utf8");
	renameSync(manifestTmp, join(dir, "manifest.json"));
	return {
		...manifest,
		fileAbs: join(dir, "original." + record.ext)
	};
}
/** Delete one stored photo dir (idempotent: a missing dir is success). */
function removePhoto(storeDir, id) {
	if (!PHOTO_ID_RE.test(id)) return;
	rmSync(join(storeDir, id), {
		recursive: true,
		force: true
	});
}
//#endregion
//#region src/routes.ts
/**
* Photo-skins HTTP routes — the browser half talks to the host through plain
* same-origin endpoints under /api/photo-skins:
*
*   GET  /list           → JSON photo list (the import store)
*   GET  /image/<id>     → the photo file (mime from manifest, ETag cached)
*   POST /import         → raw binary photo upload (magic-byte validated,
*                          size-capped, atomically stored)
*   POST /remove         → delete one imported photo (JSON {id})
*
* Compliance: photos are the user's own files — nothing is downloaded,
* uploaded or redistributed; the import only ever writes inside
* <harnessHome>/photo-skins. Every route rejects cross-site requests
* (Sec-Fetch-Site / Origin fence) because a malicious webpage must not be
* able to read or delete the user's photos through a localhost CSRF post.
* The JSON envelope, method checks and same-origin fence helpers are
* self-contained; see THIRD_PARTY_NOTICES.md.
* @module dsh-photo-skins/routes
*/
/** Browser-facing base path of the photo-skins API. */
const PHOTO_SKINS_API_PREFIX = "/api/photo-skins";
/** Max display-name length (chars). */
const MAX_NAME_LENGTH = 120;
/** One JSON response. */
function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
/** Require the method or answer 405. */
function requireMethod(req, res, method) {
	if (req.method === method) return true;
	json(res, 405, {
		ok: false,
		error: "method-not-allowed"
	});
	return false;
}
/**
* Same-origin fence. Browsers send `Sec-Fetch-Site` on every fetch: same-site
* and cross-site pages both resolve their `Origin` here, so the checks are:
* a `cross-site` fetch is always rejected, and an `Origin` that does not
* match the request `Host` is rejected. Requests without either header
* (curl, node http, old browsers) pass — this is a local single-user tool,
* and the fence only targets the cross-site browser vector.
*/
function isSameOriginRequest(req) {
	const site = req.headers["sec-fetch-site"];
	if (typeof site === "string" && site === "cross-site") return false;
	const origin = req.headers.origin;
	if (typeof origin === "string" && origin !== "" && origin !== "null") {
		const host = req.headers.host;
		if (typeof host !== "string" || host === "") return false;
		try {
			if (new URL(origin).host !== host) return false;
		} catch {
			return false;
		}
	}
	return true;
}
/** Reject cross-site requests with 403. */
function requireSameOrigin(req, res) {
	if (isSameOriginRequest(req)) return true;
	json(res, 403, {
		ok: false,
		error: "cross-site-request-rejected"
	});
	return false;
}
/**
* Read a JSON request body (bounded to 64KB).
*/
function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 65536) {
				reject(/* @__PURE__ */ new Error("body-too-large"));
				queueMicrotask(() => req.destroy());
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (chunks.length === 0) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch {
				reject(/* @__PURE__ */ new Error("invalid-json"));
			}
		});
		req.on("error", reject);
	});
}
/**
* Read a raw binary photo upload. Rejects with the HTTP status to answer:
*  - 413 when the body exceeds the byte cap (connection destroyed);
*  - 415 when the magic bytes match no supported raster format;
*  - 400 on an unreadable/empty body.
* SVG is deliberately unsupported (script risk) — the magic probe never
* matches it, so a renamed .svg is rejected on content, not on name.
* @param req - the incoming request.
* @param requestedType - the declared content-type (informational only; the
*   magic probe is the source of truth).
* @param maxBytes - the accepted body cap (injectable for tests).
*/
function readPhotoUpload(req, requestedType, maxBytes) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		let settled = false;
		const fail = (status, error) => {
			if (settled) return;
			settled = true;
			reject({
				status,
				error
			});
			queueMicrotask(() => req.destroy());
		};
		req.on("data", (chunk) => {
			if (settled) return;
			size += chunk.length;
			if (size > maxBytes) {
				fail(413, "photo-too-large");
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (settled) return;
			settled = true;
			if (chunks.length === 0) {
				reject({
					status: 400,
					error: "empty-body"
				});
				return;
			}
			const bytes = Buffer.concat(chunks);
			const type = detectPhotoType(bytes.subarray(0, 16));
			if (type === null) {
				reject({
					status: 415,
					error: "unsupported-image-type"
				});
				return;
			}
			if (requestedType !== void 0 && !requestedType.startsWith("image/") && requestedType !== "application/octet-stream") {
				reject({
					status: 415,
					error: "unsupported-image-type"
				});
				return;
			}
			const rawName = req.headers["x-photo-skin-name"];
			let name = typeof rawName === "string" ? rawName.trim() : "";
			try {
				name = decodeURIComponent(name);
			} catch {}
			name = name.slice(0, MAX_NAME_LENGTH);
			resolve({
				bytes,
				type,
				name
			});
		});
		req.on("error", () => {
			if (!settled) {
				settled = true;
				reject({
					status: 400,
					error: "unreadable-body"
				});
			}
		});
	});
}
/** Serialize one photo entry for the browser. */
function photoToJson(entry) {
	const record = photoTypeRecord(entry.type);
	return {
		id: entry.id,
		name: entry.name,
		type: entry.type,
		mime: record.mime,
		bytes: entry.bytes,
		importedAt: entry.importedAt,
		url: "/api/photo-skins/image/" + entry.id
	};
}
/** Build the photo-skins route family. */
function makePhotoSkinsRoutes(deps) {
	const now = deps.now ?? (() => Date.now());
	const random = deps.random ?? (() => Math.random().toString(36).slice(2, 8));
	const storeDir = deps.storeDir;
	const maxBytes = deps.maxBytes ?? 26214400;
	const ensureStore = () => {
		mkdirSync(storeDir, { recursive: true });
	};
	const routes = [];
	routes.push({
		kind: "exact",
		path: "/api/photo-skins/list",
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			if (!requireSameOrigin(req, res)) return;
			try {
				json(res, 200, {
					ok: true,
					photos: listPhotos(storeDir).map(photoToJson)
				});
			} catch (error) {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	});
	routes.push({
		kind: "prefix",
		path: "/api/photo-skins/image",
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			if (!requireSameOrigin(req, res)) return;
			let id;
			try {
				id = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname.slice(23));
			} catch {
				json(res, 400, {
					ok: false,
					error: "invalid-photo-id"
				});
				return;
			}
			if (!PHOTO_ID_RE.test(id)) {
				json(res, 400, {
					ok: false,
					error: "invalid-photo-id"
				});
				return;
			}
			try {
				const entry = findPhoto(storeDir, id);
				if (entry === null) {
					json(res, 404, {
						ok: false,
						error: "photo-not-found"
					});
					return;
				}
				const record = photoTypeRecord(entry.type);
				const stat = statSync(entry.fileAbs);
				const etag = "\"" + Math.round(stat.mtimeMs).toString(36) + "-" + stat.size.toString(36) + "\"";
				if (req.headers["if-none-match"] === etag) {
					res.writeHead(304, { etag });
					res.end();
					return;
				}
				res.writeHead(200, {
					"content-type": record.mime,
					"content-length": String(stat.size),
					"cache-control": "private, max-age=3600",
					etag
				});
				createReadStream(entry.fileAbs).pipe(res);
			} catch (error) {
				json(res, 500, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	});
	routes.push({
		kind: "exact",
		path: "/api/photo-skins/import",
		handler: (req, res) => {
			if (!requireMethod(req, res, "POST")) return;
			if (!requireSameOrigin(req, res)) return;
			readPhotoUpload(req, req.headers["content-type"], maxBytes).then((upload) => {
				try {
					ensureStore();
					const id = newPhotoId(now(), random);
					const name = upload.name === "" ? "photo-" + id.slice(0, 10) : upload.name;
					json(res, 200, {
						ok: true,
						photo: photoToJson(writePhoto(storeDir, id, upload.type, upload.bytes, name, now()))
					});
				} catch (error) {
					json(res, 500, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}, (failure) => {
				json(res, failure.status, {
					ok: false,
					error: failure.error
				});
			});
		}
	});
	routes.push({
		kind: "exact",
		path: "/api/photo-skins/remove",
		handler: (req, res) => {
			if (!requireMethod(req, res, "POST")) return;
			if (!requireSameOrigin(req, res)) return;
			readJsonBody(req).then((body) => {
				const id = (typeof body === "object" && body !== null ? body : {}).id;
				if (typeof id !== "string" || !PHOTO_ID_RE.test(id)) {
					json(res, 400, {
						ok: false,
						error: "invalid-photo-id"
					});
					return;
				}
				try {
					removePhoto(storeDir, id);
					json(res, 200, { ok: true });
				} catch (error) {
					json(res, 500, {
						ok: false,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}, (error) => {
				json(res, 400, {
					ok: false,
					error: error instanceof Error ? error.message : String(error)
				});
			});
		}
	});
	return routes;
}
//#endregion
//#region src/index.ts
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "photo-skins";
/** Services required before the photo-skins plugin can mount its routes. */
const inject = ["webServer"];
/**
* Settings namespace for the photo skin, owned by the photo-skins plugin.
* The browser half spells the same string so it can bind the scope without
* depending on this Host package.
*/
const PHOTO_SKINS_NAMESPACE = settingsNamespace("photo-skins");
/** Runtime schema for PhotoSkinsConfig. */
const PhotoSkinsConfigSchema = z.object({
	enabled: z.boolean().default(true),
	selection: z.string().default(""),
	fit: z.union(["cover", "contain"]).default("cover"),
	blurMode: z.union(["global", "split"]).default("global"),
	blur: z.number().min(0).max(100).step(1).default(0),
	blurEmpty: z.number().min(0).max(100).step(1).default(0),
	blurContent: z.number().min(0).max(100).step(1).default(0),
	dim: z.number().min(0).max(100).step(5).default(25),
	autoAccent: z.boolean().default(true)
});
/** Apply the host half. */
const apply = mountOnce("dsh-photo-skins", applyImpl);
function applyImpl(ctx) {
	installSettingsSection(ctx, PHOTO_SKINS_NAMESPACE, PhotoSkinsConfigSchema, {}, {
		setSource: () => {},
		onChange: () => {}
	});
	const routes = makePhotoSkinsRoutes({ storeDir: defaultPhotoSkinsStoreDir(resolveHarnessHome()) });
	try {
		ctx.effect(() => {
			const disposers = [];
			try {
				for (const route of routes) disposers.push(ctx.webServer.register(route));
			} catch (error) {
				for (const dispose of disposers) dispose();
				throw error;
			}
			return () => {
				for (const dispose of disposers) dispose();
			};
		}, "photo-skins: routes");
	} catch (error) {
		console.error("[photo-skins] route registration failed:", error);
	}
}
//#endregion
export { PHOTO_SKINS_API_PREFIX, PHOTO_SKINS_NAMESPACE, PhotoSkinsConfigSchema, apply, inject, makePhotoSkinsRoutes, name };
