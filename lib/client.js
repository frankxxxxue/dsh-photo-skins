window.__ModuleLoader__.load({
	id: "dsh-photo-skins",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:src/client/photo-skins.module.css.mjs
		const css = "body[data-dsh-photo-skin]{--dsw-alias-bg-base:#ffffff6b;--dsw-alias-bg-layer-1:#fafafb66;--dsw-alias-bg-layer-2:#fafafb7a;--dsw-alias-bg-layer-3:#fff9;--dsw-alias-bg-overlay:#f0f1f3b3;--dsw-alias-bg-module-platform:#f5f6f799;--dsw-alias-bg-multi-select:#f5f6f799;--dsw-specific-sidebar-fill:#f9fafb66;--dsw-specific-menu:#ffffffb3;--dsw-specific-input-major:#fffc}body[data-dsh-photo-skin][data-ds-dark-theme]{--dsw-alias-bg-base:#15151780;--dsw-alias-bg-layer-1:#15151773;--dsw-alias-bg-layer-2:#1b1b1c85;--dsw-alias-bg-layer-3:#1b1b1ca3;--dsw-alias-bg-overlay:#1b1b1cb8;--dsw-alias-bg-module-platform:#21212394;--dsw-alias-bg-multi-select:#21212394;--dsw-specific-sidebar-fill:#15151773;--dsw-specific-menu:#1b1b1cb8;--dsw-specific-input-major:#1b1b1cc7}body[data-dsh-photo-skins] .DzagAq_photoSection{flex-direction:column;gap:10px;display:flex}body[data-dsh-photo-skins] .DzagAq_enableRow{flex-wrap:wrap;align-items:center;gap:8px;display:flex}body[data-dsh-photo-skins] .DzagAq_enableLabel{color:var(--ds-color-text-primary,inherit);font-size:13px;font-weight:600}body[data-dsh-photo-skins] .DzagAq_enableHint{color:var(--ds-color-text-secondary,#7f7f8fe6);flex-basis:100%;margin:0;font-size:12px;line-height:1.5}body[data-dsh-photo-skins] .DzagAq_statusRow{color:var(--ds-color-text-secondary,#7f7f8fe6);align-items:center;gap:8px;font-size:12px;display:flex}body[data-dsh-photo-skins] .DzagAq_statusError{color:var(--ds-color-text-danger,#e5484d)}body[data-dsh-photo-skins] .DzagAq_controls{background:#7f7f8f14;border-radius:8px;flex-direction:column;gap:8px;padding:8px;display:flex}body[data-dsh-photo-skins] .DzagAq_themeRow{align-items:center;gap:6px;display:flex}body[data-dsh-photo-skins] .DzagAq_themeLabel{color:var(--ds-color-text-secondary,#7f7f8fe6);margin-right:2px;font-size:12px}body[data-dsh-photo-skins] .DzagAq_themeButton{border:1px solid var(--ds-color-border,#7f7f8f4d);color:var(--ds-color-text-primary,inherit);cursor:pointer;background:0 0;border-radius:6px;padding:3px 10px;font-size:12px}body[data-dsh-photo-skins] .DzagAq_themeButtonActive{background:var(--dsw-photo-accent,var(--ds-color-accent,#2e6be6));color:var(--dsw-photo-accent-contrast,#fff);border-color:#0000}body[data-dsh-photo-skins] .DzagAq_backgroundRow{grid-template-columns:auto 1fr;align-items:center;gap:4px 10px;display:grid}body[data-dsh-photo-skins] .DzagAq_backgroundHead{justify-content:space-between;gap:8px;display:flex}body[data-dsh-photo-skins] .DzagAq_backgroundLabel{color:var(--ds-color-text-secondary,#7f7f8fe6);font-size:12px}body[data-dsh-photo-skins] .DzagAq_backgroundValue{color:var(--ds-color-text-primary,inherit);text-align:right;min-width:34px;font-size:12px}body[data-dsh-photo-skins] .DzagAq_backgroundRange{width:100%;accent-color:var(--dsw-photo-accent,var(--ds-color-accent,#2e6be6))}body[data-dsh-photo-skins] .DzagAq_dropZone{border:1px dashed var(--ds-color-border,#7f7f8f59);background:#7f7f8f0d;border-radius:8px;align-items:center;gap:10px;padding:10px;display:flex}body[data-dsh-photo-skins] .DzagAq_dropZoneOver{border-color:var(--dsw-photo-accent,var(--ds-color-accent,#2e6be6));background:var(--dsw-photo-accent-soft,#2e6be61f)}body[data-dsh-photo-skins] .DzagAq_fileInput{display:none}body[data-dsh-photo-skins] .DzagAq_dropHint{color:var(--ds-color-text-secondary,#7f7f8fe6);font-size:12px}body[data-dsh-photo-skins] .DzagAq_hintMuted{color:var(--ds-color-text-secondary,#7f7f8fbf);margin:0;font-size:11px}body[data-dsh-photo-skins] .DzagAq_error{color:var(--ds-color-text-danger,#e5484d);font-size:12px}body[data-dsh-photo-skins] .DzagAq_photoGrid{grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px;display:grid}body[data-dsh-photo-skins] .DzagAq_photoCard{border:1px solid var(--ds-color-border,#7f7f8f40);background:#7f7f8f0f;border-radius:8px;flex-direction:column;gap:4px;padding:6px;display:flex}body[data-dsh-photo-skins] .DzagAq_photoThumbWrap{aspect-ratio:16/10;background:#0000002e;border-radius:6px;position:relative;overflow:hidden}body[data-dsh-photo-skins] .DzagAq_photoThumb{object-fit:cover;width:100%;height:100%;display:block}body[data-dsh-photo-skins] .DzagAq_photoThumbEmpty{width:100%;height:100%}body[data-dsh-photo-skins] .DzagAq_badge{color:#fff;background:#14141cb8;border-radius:5px;padding:1px 6px;font-size:10px;position:absolute;top:4px;right:4px}body[data-dsh-photo-skins] .DzagAq_badgeActive{background:var(--dsw-photo-accent,#2e6be6);color:var(--dsw-photo-accent-contrast,#fff)}body[data-dsh-photo-skins] .DzagAq_badgeTrying{color:#fff;background:#14141cb8}body[data-dsh-photo-skins] .DzagAq_photoName{text-overflow:ellipsis;white-space:nowrap;color:var(--ds-color-text-primary,inherit);font-size:12px;overflow:hidden}body[data-dsh-photo-skins] .DzagAq_photoMeta{color:var(--ds-color-text-secondary,#7f7f8fcc);font-size:10px}body[data-dsh-photo-skins] .DzagAq_photoActions{flex-wrap:wrap;gap:4px;display:flex}body[data-dsh-photo-skins] .DzagAq_button{border:1px solid var(--ds-color-border,#7f7f8f4d);color:var(--ds-color-text-primary,inherit);cursor:pointer;background:0 0;border-radius:6px;padding:3px 10px;font-size:12px}body[data-dsh-photo-skins] .DzagAq_button:disabled{opacity:.55;cursor:default}body[data-dsh-photo-skins] .DzagAq_buttonPrimary{background:var(--dsw-photo-accent,var(--ds-color-accent,#2e6be6));color:var(--dsw-photo-accent-contrast,#fff);border-color:#0000}body[data-dsh-photo-skins] .DzagAq_buttonGhost{color:var(--ds-color-text-secondary,#7f7f8fe6);border-color:#0000}body[data-dsh-photo-skins] .DzagAq_switch{border:1px solid var(--ds-color-border,#7f7f8f59);cursor:pointer;background:#7f7f8f40;border-radius:9px;flex-shrink:0;width:34px;height:18px;padding:0;position:relative}body[data-dsh-photo-skins] .DzagAq_switchOn{background:var(--dsw-photo-accent,var(--ds-color-accent,#2e6be6));border-color:#0000}body[data-dsh-photo-skins] .DzagAq_switchThumb{background:#fff;border-radius:50%;width:12px;height:12px;transition:transform .12s;position:absolute;top:2px;left:2px}body[data-dsh-photo-skins] .DzagAq_switchOn .DzagAq_switchThumb{transform:translate(16px)}";
		const tagId = "dsh-photo-skins/photo-skins.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-photo-skins";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var photo_skins_module_css_default = {
			"backgroundHead": "DzagAq_backgroundHead",
			"backgroundLabel": "DzagAq_backgroundLabel",
			"backgroundRange": "DzagAq_backgroundRange",
			"backgroundRow": "DzagAq_backgroundRow",
			"backgroundValue": "DzagAq_backgroundValue",
			"badge": "DzagAq_badge",
			"badgeActive": "DzagAq_badgeActive",
			"badgeTrying": "DzagAq_badgeTrying",
			"button": "DzagAq_button",
			"buttonGhost": "DzagAq_buttonGhost",
			"buttonPrimary": "DzagAq_buttonPrimary",
			"controls": "DzagAq_controls",
			"dropHint": "DzagAq_dropHint",
			"dropZone": "DzagAq_dropZone",
			"dropZoneOver": "DzagAq_dropZoneOver",
			"enableHint": "DzagAq_enableHint",
			"enableLabel": "DzagAq_enableLabel",
			"enableRow": "DzagAq_enableRow",
			"error": "DzagAq_error",
			"fileInput": "DzagAq_fileInput",
			"hintMuted": "DzagAq_hintMuted",
			"photoActions": "DzagAq_photoActions",
			"photoCard": "DzagAq_photoCard",
			"photoGrid": "DzagAq_photoGrid",
			"photoMeta": "DzagAq_photoMeta",
			"photoName": "DzagAq_photoName",
			"photoSection": "DzagAq_photoSection",
			"photoThumb": "DzagAq_photoThumb",
			"photoThumbEmpty": "DzagAq_photoThumbEmpty",
			"photoThumbWrap": "DzagAq_photoThumbWrap",
			"statusError": "DzagAq_statusError",
			"statusRow": "DzagAq_statusRow",
			"switch": "DzagAq_switch",
			"switchOn": "DzagAq_switchOn",
			"switchThumb": "DzagAq_switchThumb",
			"themeButton": "DzagAq_themeButton",
			"themeButtonActive": "DzagAq_themeButtonActive",
			"themeLabel": "DzagAq_themeLabel",
			"themeRow": "DzagAq_themeRow"
		};
		//#endregion
		//#region src/client/PhotoSkinsPanel.tsx
		/**
		* The photo-skins card: rendered as the content of a first-level settings
		* section, listing every imported photo with live try-on, one-click apply,
		* removal, and render tuning (fit / blur / dim / accent). Rendering and
		* persistence ride the PhotoSkinController (photo-skin.ts); the photo bytes
		* come from and go to the host's /api/photo-skins routes.
		*
		* Compliance: photos are the user's own files. The card only uploads them to
		* the local host store (<harnessHome>/photo-skins) and never shares content;
		* removal deletes the local copy.
		*/
		/** Post one photo removal and return whether it succeeded. */
		async function postRemove(id) {
			try {
				const response = await fetch("/api/photo-skins/remove", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				});
				const payload = await response.json().catch(() => null);
				if (!response.ok || payload?.ok !== true) return payload?.error ?? "HTTP " + String(response.status);
				return null;
			} catch (error) {
				return error instanceof Error ? error.message : String(error);
			}
		}
		/** Upload one file as a raw binary body; the name rides a dedicated header. */
		async function postImport(file) {
			try {
				const bytes = new Uint8Array(await file.arrayBuffer());
				const response = await fetch("/api/photo-skins/import", {
					method: "POST",
					headers: {
						"content-type": file.type !== "" ? file.type : "application/octet-stream",
						"x-photo-skin-name": encodeURIComponent(file.name)
					},
					body: bytes
				});
				const payload = await response.json().catch(() => null);
				if (!response.ok || payload?.ok !== true || payload?.photo === void 0) return {
					error: payload?.error ?? "HTTP " + String(response.status),
					photo: null
				};
				return {
					error: null,
					photo: payload.photo
				};
			} catch (error) {
				return {
					error: error instanceof Error ? error.message : String(error),
					photo: null
				};
			}
		}
		/** Human-readable byte size. */
		function formatBytes(bytes) {
			if (bytes < 1024) return String(bytes) + " B";
			if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
			return (bytes / 1048576).toFixed(1) + " MB";
		}
		/** Map a host error code to localized copy, falling back to the raw text. */
		function errorText(t, error) {
			switch (error) {
				case "photo-too-large": return t("errorTooLarge");
				case "unsupported-image-type": return t("errorBadType");
				case "empty-body": return t("errorBadType");
				default: return error;
			}
		}
		/** Render the photo-skins section of the settings surface. */
		function PhotoSkinsPanel({ t, photoSkin }) {
			const enabled = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.enabled());
			const selection = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.selection());
			const fit = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.fit());
			const blurMode = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.blurMode());
			const blur = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.blur());
			const blurEmpty = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.blurEmpty());
			const blurContent = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.blurContent());
			const dim = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.dim());
			const autoAccent = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.autoAccent());
			const activeId = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.activeId());
			const trying = (0, react.useSyncExternalStore)((listener) => photoSkin.subscribe(listener), () => photoSkin.trying());
			const [items, setItems] = (0, react.useState)(null);
			const [loadError, setLoadError] = (0, react.useState)(null);
			const [actionError, setActionError] = (0, react.useState)(null);
			const [workingId, setWorkingId] = (0, react.useState)(null);
			const [importing, setImporting] = (0, react.useState)(false);
			const [dragOver, setDragOver] = (0, react.useState)(false);
			const fileInput = (0, react.useRef)(null);
			const mounted = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			/** Fetch the list and reconcile the mounted layer with the selection. */
			const load = (0, react.useCallback)(() => {
				fetch("/api/photo-skins/list").then(async (response) => {
					const payload = await response.json().catch(() => null);
					if (!mounted.current) return;
					if (!response.ok || payload?.ok !== true || !Array.isArray(payload.photos)) {
						setLoadError(payload?.error ?? "HTTP " + String(response.status));
						setItems([]);
						return;
					}
					setLoadError(null);
					setItems(payload.photos);
					const selected = photoSkin.selection();
					photoSkin.sync(payload.photos.find((w) => w.id === selected) ?? null);
				}).catch((error) => {
					if (!mounted.current) return;
					setLoadError(error instanceof Error ? error.message : String(error));
					setItems([]);
				});
			}, [photoSkin]);
			(0, react.useEffect)(load, [load]);
			/** Import a set of files, sequentially, feeding errors to the error row. */
			const importFiles = (0, react.useCallback)((files) => {
				const images = files.filter((file) => file.type === "" || file.type.startsWith("image/") || file.type === "application/octet-stream");
				if (images.length === 0) {
					setActionError(t("errorBadType"));
					return;
				}
				setActionError(null);
				setImporting(true);
				(async () => {
					let firstError = null;
					for (const file of images) {
						if (!mounted.current) break;
						const result = await postImport(file);
						if (!mounted.current) break;
						if (result.error !== null) firstError = firstError ?? errorText(t, result.error);
					}
					if (!mounted.current) return;
					setImporting(false);
					setActionError(firstError);
					load();
				})();
			}, [load, t]);
			/** Paste handler: images pasted from the clipboard import directly. */
			(0, react.useEffect)(() => {
				const onPaste = (event) => {
					const files = Array.from(event.clipboardData?.files ?? []);
					if (files.length > 0) {
						event.preventDefault();
						importFiles(files);
					}
				};
				window.addEventListener("paste", onPaste);
				return () => {
					window.removeEventListener("paste", onPaste);
				};
			}, [importFiles]);
			const runRemove = (id) => {
				setActionError(null);
				setWorkingId(id);
				postRemove(id).then((error) => {
					if (!mounted.current) return;
					setWorkingId(null);
					if (error !== null) {
						setActionError(error);
						return;
					}
					if (photoSkin.selection() === id) photoSkin.clearSelection();
					load();
				});
			};
			const appliedId = selection;
			const busy = importing || workingId !== null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: photo_skins_module_css_default.photoSection,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: photo_skins_module_css_default.enableRow,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: photo_skins_module_css_default.enableLabel,
							title: t("enable"),
							children: t("title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "switch",
							"aria-checked": enabled,
							"aria-label": t("enable"),
							className: enabled ? photo_skins_module_css_default.switch + " " + photo_skins_module_css_default.switchOn : photo_skins_module_css_default.switch,
							onClick: () => {
								photoSkin.setEnabled(!enabled);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: photo_skins_module_css_default.switchThumb })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: photo_skins_module_css_default.enableHint,
							children: t("hint")
						})
					]
				}), enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: photo_skins_module_css_default.statusRow,
						children: [loadError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: photo_skins_module_css_default.statusError,
							children: [
								t("loadError"),
								": ",
								loadError
							]
						}) : items === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("loading") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: items.length }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: photo_skins_module_css_default.button,
							onClick: load,
							disabled: busy,
							children: t("refresh")
						})]
					}),
					appliedId !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: photo_skins_module_css_default.controls,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: photo_skins_module_css_default.themeRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: photo_skins_module_css_default.themeLabel,
										children: t("fit")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: photo_skins_module_css_default.themeButton + (fit === "cover" ? " " + photo_skins_module_css_default.themeButtonActive : ""),
										onClick: () => {
											photoSkin.setFit("cover");
										},
										children: t("fitCover")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: photo_skins_module_css_default.themeButton + (fit === "contain" ? " " + photo_skins_module_css_default.themeButtonActive : ""),
										onClick: () => {
											photoSkin.setFit("contain");
										},
										children: t("fitContain")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: photo_skins_module_css_default.button + " " + photo_skins_module_css_default.buttonGhost,
										onClick: () => {
											photoSkin.clearSelection();
										},
										children: t("clear")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: photo_skins_module_css_default.themeRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: photo_skins_module_css_default.themeLabel,
										children: t("blurMode")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: photo_skins_module_css_default.themeButton + (blurMode === "global" ? " " + photo_skins_module_css_default.themeButtonActive : ""),
										onClick: () => {
											photoSkin.setBlurMode("global");
										},
										children: t("blurModeGlobal")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: photo_skins_module_css_default.themeButton + (blurMode === "split" ? " " + photo_skins_module_css_default.themeButtonActive : ""),
										onClick: () => {
											photoSkin.setBlurMode("split");
										},
										children: t("blurModeSplit")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: photo_skins_module_css_default.backgroundRow,
								children: [
									blurMode === "global" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: photo_skins_module_css_default.backgroundHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: photo_skins_module_css_default.backgroundLabel,
											children: t("blur")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: photo_skins_module_css_default.backgroundValue,
											"aria-hidden": "true",
											children: [blur, "px"]
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: photo_skins_module_css_default.backgroundRange,
										type: "range",
										min: "0",
										max: "100",
										step: "1",
										value: blur,
										"aria-label": t("blur"),
										onChange: (event) => {
											photoSkin.setBlur(Number(event.target.value));
										}
									})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: photo_skins_module_css_default.backgroundHead,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: photo_skins_module_css_default.backgroundLabel,
												children: t("blurEmpty")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: photo_skins_module_css_default.backgroundValue,
												"aria-hidden": "true",
												children: [blurEmpty, "px"]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: photo_skins_module_css_default.backgroundRange,
											type: "range",
											min: "0",
											max: "100",
											step: "1",
											value: blurEmpty,
											"aria-label": t("blurEmpty"),
											onChange: (event) => {
												photoSkin.setBlurEmpty(Number(event.target.value));
											}
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: photo_skins_module_css_default.backgroundHead,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: photo_skins_module_css_default.backgroundLabel,
												children: t("blurContent")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: photo_skins_module_css_default.backgroundValue,
												"aria-hidden": "true",
												children: [blurContent, "px"]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: photo_skins_module_css_default.backgroundRange,
											type: "range",
											min: "0",
											max: "100",
											step: "1",
											value: blurContent,
											"aria-label": t("blurContent"),
											onChange: (event) => {
												photoSkin.setBlurContent(Number(event.target.value));
											}
										})
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: photo_skins_module_css_default.backgroundHead,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: photo_skins_module_css_default.backgroundLabel,
											children: t("dim")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: photo_skins_module_css_default.backgroundValue,
											"aria-hidden": "true",
											children: [dim, "%"]
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: photo_skins_module_css_default.backgroundRange,
										type: "range",
										min: "0",
										max: "100",
										step: "5",
										value: dim,
										"aria-label": t("dim"),
										onChange: (event) => {
											photoSkin.setDim(Number(event.target.value));
										}
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: photo_skins_module_css_default.enableRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: photo_skins_module_css_default.enableLabel,
										title: t("autoAccentHint"),
										children: t("autoAccent")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										role: "switch",
										"aria-checked": autoAccent,
										"aria-label": t("autoAccent"),
										className: autoAccent ? photo_skins_module_css_default.switch + " " + photo_skins_module_css_default.switchOn : photo_skins_module_css_default.switch,
										onClick: () => {
											photoSkin.setAutoAccent(!autoAccent);
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: photo_skins_module_css_default.switchThumb })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: photo_skins_module_css_default.enableHint,
										children: t("autoAccentHint")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: dragOver ? photo_skins_module_css_default.dropZone + " " + photo_skins_module_css_default.dropZoneOver : photo_skins_module_css_default.dropZone,
						onDragOver: (event) => {
							event.preventDefault();
							setDragOver(true);
						},
						onDragLeave: () => {
							setDragOver(false);
						},
						onDrop: (event) => {
							event.preventDefault();
							setDragOver(false);
							importFiles(Array.from(event.dataTransfer.files));
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: fileInput,
								className: photo_skins_module_css_default.fileInput,
								type: "file",
								accept: "image/png,image/jpeg,image/webp,image/gif",
								multiple: true,
								onChange: (event) => {
									const files = Array.from(event.target.files ?? []);
									if (event.target) event.target.value = "";
									importFiles(files);
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: photo_skins_module_css_default.button + " " + photo_skins_module_css_default.buttonPrimary,
								disabled: busy,
								onClick: () => {
									fileInput.current?.click();
								},
								children: importing ? t("loading") : t("import")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: photo_skins_module_css_default.dropHint,
								children: dragOver ? t("dropHint") : t("importHint")
							})
						]
					}),
					actionError !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: photo_skins_module_css_default.error,
						children: actionError
					}),
					items !== null && items.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: photo_skins_module_css_default.photoGrid,
						children: items.map((item) => {
							const isApplied = item.id === appliedId;
							const isMounted = item.id === activeId;
							const busyId = workingId === item.id;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: photo_skins_module_css_default.photoCard,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: photo_skins_module_css_default.photoThumbWrap,
										children: [item.url !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											className: photo_skins_module_css_default.photoThumb,
											src: item.url,
											alt: "",
											loading: "lazy"
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: photo_skins_module_css_default.photoThumbEmpty,
											"aria-hidden": "true"
										}), isMounted && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: photo_skins_module_css_default.badge + " " + (trying ? photo_skins_module_css_default.badgeTrying : photo_skins_module_css_default.badgeActive),
											children: trying ? t("tryOn") : t("active")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: photo_skins_module_css_default.photoName,
										title: item.name,
										children: item.name
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: photo_skins_module_css_default.photoMeta,
										children: formatBytes(item.bytes)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: photo_skins_module_css_default.photoActions,
										children: [
											isMounted && trying ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: photo_skins_module_css_default.button + " " + photo_skins_module_css_default.buttonPrimary,
												onClick: () => {
													photoSkin.exitTryOn();
												},
												children: t("exitTryOn")
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: photo_skins_module_css_default.button + " " + photo_skins_module_css_default.buttonPrimary,
												disabled: isApplied || busy,
												onClick: () => {
													photoSkin.tryOn(item);
												},
												children: t("tryOn")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: photo_skins_module_css_default.button,
												disabled: isApplied || busy,
												onClick: () => {
													photoSkin.applySelection(item);
												},
												children: isApplied ? t("active") : t("apply")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: photo_skins_module_css_default.button + " " + photo_skins_module_css_default.buttonGhost,
												disabled: busy,
												onClick: () => {
													runRemove(item.id);
												},
												children: busyId ? t("loading") : t("remove")
											})
										]
									})
								]
							}, item.id);
						})
					}),
					items !== null && items.length === 0 && loadError === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: photo_skins_module_css_default.hintMuted,
						children: t("empty")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: photo_skins_module_css_default.hintMuted,
						children: t("legal")
					})
				] })]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* UI copy for the photo-skins card. zh is the key source; en mirrors the
		* exact key set. Registered through ctx.locale.register under 'photoSkins'.
		* @module dsh-photo-skins/locales
		*/
		const zh = {
			title: "照片皮肤",
			enable: "启用照片皮肤",
			hint: "导入你自己的照片，把它变成这个界面的皮肤：照片铺在界面后面，界面强调色跟随照片取色。",
			import: "导入照片",
			importHint: "支持 PNG / JPG / WebP / GIF，单张不超过 25MB；也可以把图片拖进来或直接粘贴。",
			dropHint: "松开以导入照片",
			refresh: "刷新",
			loading: "加载中...",
			loadError: "加载照片列表失败",
			empty: "还没有照片：先导入一张，它就出现在这里。",
			tryOn: "试穿",
			exitTryOn: "结束试穿",
			apply: "应用",
			active: "使用中",
			clear: "清除",
			fit: "填充方式",
			fitCover: "铺满",
			fitContain: "完整显示",
			blurMode: "模糊方式",
			blurModeGlobal: "全局模糊",
			blurModeSplit: "拆分模糊",
			blur: "模糊",
			blurEmpty: "无对话模糊",
			blurContent: "有对话模糊",
			dim: "压暗",
			autoAccent: "跟随照片取色",
			autoAccentHint: "从照片提取主色，作为界面强调色与明暗遮罩色调。",
			remove: "删除",
			photoMissing: "照片已不存在",
			errorBadType: "不支持的图片格式（仅 PNG / JPG / WebP / GIF）",
			errorTooLarge: "图片超过 25MB 限制",
			legal: "照片只保存在本机（DSH 数据目录的 photo-skins 文件夹），不会上传或分享。"
		};
		const en = {
			title: "Photo skins",
			enable: "Enable photo skins",
			hint: "Import your own photos and turn them into this UI's skin: the photo sits behind the interface and the accent colors follow the photo.",
			import: "Import photos",
			importHint: "PNG / JPG / WebP / GIF, up to 25MB each; you can also drop or paste images here.",
			dropHint: "Release to import",
			refresh: "Refresh",
			loading: "Loading...",
			loadError: "Failed to load the photo list",
			empty: "No photos yet: import one and it shows up here.",
			tryOn: "Try on",
			exitTryOn: "Exit try-on",
			apply: "Apply",
			active: "Active",
			clear: "Clear",
			fit: "Fit",
			fitCover: "Cover",
			fitContain: "Contain",
			blurMode: "Blur mode",
			blurModeGlobal: "Global blur",
			blurModeSplit: "Split blur",
			blur: "Blur",
			blurEmpty: "Blur (empty)",
			blurContent: "Blur (with content)",
			dim: "Dim",
			autoAccent: "Accent from photo",
			autoAccentHint: "Extract the dominant color from the photo and tint the interface accents and scrims.",
			remove: "Remove",
			photoMissing: "Photo no longer exists",
			errorBadType: "Unsupported image format (PNG / JPG / WebP / GIF only)",
			errorTooLarge: "Image exceeds the 25MB limit",
			legal: "Photos stay on this machine (the photo-skins folder inside the DSH data directory) and are never uploaded or shared."
		};
		//#endregion
		//#region src/client/accent.ts
		const hex2 = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
		/** `#rrggbb` from an RGB color. */
		function rgbToHex(rgb) {
			return "#" + hex2(rgb.r) + hex2(rgb.g) + hex2(rgb.b);
		}
		/** Relative luminance (0-1), Rec. 601 weights. */
		function luminance(rgb) {
			return (.299 * rgb.r + .587 * rgb.g + .114 * rgb.b) / 255;
		}
		/** Mix two RGB colors (t 0-1: 0 = a, 1 = b). */
		function mix(a, b, t) {
			const clamped = Math.max(0, Math.min(1, t));
			return {
				r: a.r + (b.r - a.r) * clamped,
				g: a.g + (b.g - a.g) * clamped,
				b: a.b + (b.b - a.b) * clamped
			};
		}
		/** The dominant RGB color from a pixel sample (bucket histogram + average). */
		function dominantColor(pixels) {
			const { data, width, height } = pixels;
			const buckets = /* @__PURE__ */ new Map();
			const step = Math.max(1, Math.floor(width * height / 4096));
			for (let i = 0; i < data.length; i += 4 * step) {
				if ((data[i + 3] ?? 255) < 128) continue;
				const r = data[i] ?? 0;
				const g = data[i + 1] ?? 0;
				const b = data[i + 2] ?? 0;
				const key = r >> 4 << 8 | g >> 4 << 4 | b >> 4;
				const bucket = buckets.get(key);
				if (bucket === void 0) buckets.set(key, {
					count: 1,
					r,
					g,
					b
				});
				else {
					bucket.count += 1;
					bucket.r += r;
					bucket.g += g;
					bucket.b += b;
				}
			}
			let best = null;
			for (const bucket of buckets.values()) if (best === null || bucket.count > best.count) best = bucket;
			if (best === null) return {
				r: 24,
				g: 24,
				b: 32
			};
			return {
				r: best.r / best.count,
				g: best.g / best.count,
				b: best.b / best.count
			};
		}
		/** Average (luminance-weighted) RGB over the sample. */
		function averageColor(pixels) {
			const { data, width, height } = pixels;
			const step = Math.max(1, Math.floor(width * height / 4096));
			let count = 0;
			let r = 0;
			let g = 0;
			let b = 0;
			for (let i = 0; i < data.length; i += 4 * step) {
				if ((data[i + 3] ?? 255) < 128) continue;
				r += data[i] ?? 0;
				g += data[i + 1] ?? 0;
				b += data[i + 2] ?? 0;
				count += 1;
			}
			if (count === 0) return {
				r: 24,
				g: 24,
				b: 32
			};
			return {
				r: r / count,
				g: g / count,
				b: b / count
			};
		}
		/** Readable text color on a given background: white on dark, near-black on light. */
		function contrastTextFor(rgb) {
			return luminance(rgb) > .5 ? "#101828" : "#ffffff";
		}
		/**
		* Derive the full accent palette from a pixel sample. The accent is the
		* dominant color nudged toward the sample average (a third of the way) so a
		* tiny saturated detail cannot hijack the whole palette; the scrims mix the
		* accent with black (dark theme) and white (light theme).
		* @param pixels - the downscaled photo sample.
		* @returns the palette.
		*/
		function samplePalette(pixels) {
			const accent = mix(dominantColor(pixels), averageColor(pixels), 1 / 3);
			const scrimDark = mix(accent, {
				r: 0,
				g: 0,
				b: 0
			}, .82);
			const scrimLight = mix(accent, {
				r: 255,
				g: 255,
				b: 255
			}, .9);
			return {
				accent: rgbToHex(accent),
				accentSoft: "rgba(" + Math.round(accent.r) + ", " + Math.round(accent.g) + ", " + Math.round(accent.b) + ", 0.18)",
				accentContrast: contrastTextFor(accent),
				scrimDark: "rgba(" + Math.round(scrimDark.r) + ", " + Math.round(scrimDark.g) + ", " + Math.round(scrimDark.b) + ", 0.34)",
				scrimLight: "rgba(" + Math.round(scrimLight.r) + ", " + Math.round(scrimLight.g) + ", " + Math.round(scrimLight.b) + ", 0.10)"
			};
		}
		//#endregion
		//#region src/client/photo-skin.ts
		/** The namespace string the Host registers (mirrors src/index.ts). */
		const PHOTO_SKINS_NS = "photo-skins";
		/** CSS custom properties written to document.body while a palette is active. */
		const ACCENT_VARS = [
			"--dsw-photo-accent",
			"--dsw-photo-accent-soft",
			"--dsw-photo-accent-contrast"
		];
		/** Body background properties the controller saves and restores verbatim. */
		const BACKDROP_PROPERTIES = [
			"background-image",
			"background-position",
			"background-size",
			"background-attachment",
			"background-repeat"
		];
		/**
		* Selector for a conversation message row inside the shell's center column.
		* The `data-pane="conversation"` attribute is stamped on the center column;
		* the `_userRow` / `_compactionRow` / `_contextRow` / `_turnErrorRow` suffixes
		* are the shell's CSS-module message-row classes (hash prefix varies, suffix
		* is stable).
		*/
		const CONVERSATION_CONTENT_SELECTOR = [
			"[data-pane=\"conversation\"] [class*=\"_userRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_compactionRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_contextRow\"]",
			"[data-pane=\"conversation\"] [class*=\"_turnErrorRow\"]"
		].join(", ");
		/** Mark/unmark the body with the photo-skin attribute (idempotent). */
		function setBodyMarked(body, on) {
			if (on) body.dataset.dshPhotoSkin = "";
			else delete body.dataset.dshPhotoSkin;
		}
		/** Max accent-sampling canvas edge: the palette never needs more pixels. */
		const SAMPLE_MAX_EDGE = 64;
		const clamp = (value, min, max) => Math.max(min, Math.min(max, Math.round(value)));
		/** Neutral (accent-less) light/dark veils — a whisper, not a wash: the dim
		*  slider and translucent panels do the readability work. */
		const NEUTRAL_SCIM = {
			dark: "rgba(4, 8, 16, 0.32)",
			light: "rgba(250, 250, 252, 0.08)"
		};
		/**
		* Own the photo-skins scope: keep the painted body backdrop in sync with the
		* persisted selection and the card-driven descriptor resolution.
		*/
		var PhotoSkinController = class {
			enabledValue = true;
			selectionValue = "";
			fitValue = "cover";
			blurModeValue = "global";
			blurValue = 0;
			blurEmptyValue = 0;
			blurContentValue = 0;
			dimValue = 25;
			autoAccentValue = true;
			listeners = /* @__PURE__ */ new Set();
			scope;
			/** The descriptor of the applied selection, resolved by the card. */
			applied = null;
			/** The try-on descriptor while a preview is up. */
			previewing = null;
			/** The active accent palette (null while none is applied). */
			palette = null;
			/** The photo id the current palette was derived from. */
			palettePhotoId = null;
			/** Saved original body backdrop properties (restored on clear/dispose). */
			previous = /* @__PURE__ */ new Map();
			/** The background-image string last written by this controller (loop guard). */
			lastImage = "";
			/** The fixed backdrop-filter blur element, present only while blur > 0. */
			blurElement = null;
			observer = null;
			/** Lazy conversation-content observer for the split blur mode. */
			conversationObserver = null;
			/** Pending rAF id for a coalesced conversation recheck. */
			conversationRafId = null;
			disposed = false;
			constructor(scope) {
				this.scope = scope;
				this.readAll();
				scope.subscribe(() => {
					this.readAll();
					this.render();
					this.publish();
				});
				this.observer = new MutationObserver(() => this.reassertIfNeeded());
				this.observer.observe(document.body, {
					attributes: true,
					attributeFilter: ["style", "data-ds-dark-theme"]
				});
			}
			enabled() {
				return this.enabledValue;
			}
			selection() {
				return this.selectionValue;
			}
			fit() {
				return this.fitValue;
			}
			blurMode() {
				return this.blurModeValue;
			}
			blur() {
				return this.blurValue;
			}
			blurEmpty() {
				return this.blurEmptyValue;
			}
			blurContent() {
				return this.blurContentValue;
			}
			dim() {
				return this.dimValue;
			}
			autoAccent() {
				return this.autoAccentValue;
			}
			activeId() {
				const current = this.previewing ?? this.applied;
				return current !== null && this.lastImage !== "" ? current.id : null;
			}
			trying() {
				return this.previewing !== null;
			}
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			setEnabled(value) {
				this.enabledValue = value;
				this.render();
				this.publish();
				this.scope.set("enabled", value);
			}
			setFit(value) {
				this.fitValue = value;
				this.render();
				this.publish();
				this.scope.set("fit", value);
			}
			setBlurMode(value) {
				this.blurModeValue = value;
				this.render();
				this.publish();
				this.scope.set("blurMode", value);
			}
			setBlur(value) {
				this.blurValue = clamp(value, 0, 100);
				this.render();
				this.publish();
				this.scope.set("blur", this.blurValue);
			}
			setBlurEmpty(value) {
				this.blurEmptyValue = clamp(value, 0, 100);
				this.render();
				this.publish();
				this.scope.set("blurEmpty", this.blurEmptyValue);
			}
			setBlurContent(value) {
				this.blurContentValue = clamp(value, 0, 100);
				this.render();
				this.publish();
				this.scope.set("blurContent", this.blurContentValue);
			}
			setDim(value) {
				this.dimValue = clamp(value, 0, 100);
				this.render();
				this.publish();
				this.scope.set("dim", this.dimValue);
			}
			setAutoAccent(value) {
				this.autoAccentValue = value;
				this.render();
				this.publish();
				this.scope.set("autoAccent", value);
			}
			applySelection(descriptor) {
				this.applied = descriptor;
				this.previewing = null;
				this.selectionValue = descriptor.id;
				this.render();
				this.publish();
				this.scope.set("selection", descriptor.id);
			}
			clearSelection() {
				this.applied = null;
				this.previewing = null;
				this.selectionValue = "";
				this.render();
				this.publish();
				this.scope.set("selection", "");
			}
			sync(descriptor) {
				this.applied = descriptor;
				this.render();
			}
			tryOn(descriptor) {
				this.previewing = descriptor;
				this.render();
				this.publish();
			}
			exitTryOn() {
				if (this.previewing === null) return;
				this.previewing = null;
				this.render();
				this.publish();
			}
			dispose() {
				this.disposed = true;
				this.observer?.disconnect();
				this.observer = null;
				this.disconnectConversationObserver();
				this.clearBackdrop();
			}
			readAll() {
				const value = this.scope.getSnapshot().value ?? {};
				this.enabledValue = typeof value.enabled === "boolean" ? value.enabled : true;
				this.selectionValue = typeof value.selection === "string" ? value.selection : "";
				this.fitValue = value.fit === "contain" ? "contain" : "cover";
				this.blurModeValue = value.blurMode === "split" ? "split" : "global";
				this.blurValue = typeof value.blur === "number" && Number.isFinite(value.blur) ? clamp(value.blur, 0, 100) : 0;
				this.blurEmptyValue = typeof value.blurEmpty === "number" && Number.isFinite(value.blurEmpty) ? clamp(value.blurEmpty, 0, 100) : 0;
				this.blurContentValue = typeof value.blurContent === "number" && Number.isFinite(value.blurContent) ? clamp(value.blurContent, 0, 100) : 0;
				this.dimValue = typeof value.dim === "number" && Number.isFinite(value.dim) ? clamp(value.dim, 0, 100) : 25;
				this.autoAccentValue = typeof value.autoAccent === "boolean" ? value.autoAccent : true;
			}
			/** Reconcile the painted backdrop with (enabled, previewing ?? applied). */
			render() {
				if (this.disposed) return;
				const current = this.enabledValue ? this.previewing ?? this.applied : null;
				if (current === null) {
					this.clearBackdrop();
					return;
				}
				this.paintBackdrop(current);
			}
			/** The descriptor currently being painted (preview wins over applied). */
			activeDescriptor() {
				return this.enabledValue ? this.previewing ?? this.applied : null;
			}
			/** Re-apply the backdrop if a competing write changed the body background. */
			reassertIfNeeded() {
				if (this.disposed) return;
				if (this.activeDescriptor() === null) return;
				if (document.body.style.getPropertyValue("background-image") === this.lastImage) return;
				this.paintBackdrop(this.activeDescriptor());
			}
			paintBackdrop(descriptor) {
				const body = document.body;
				if (this.previous.size === 0) for (const prop of BACKDROP_PROPERTIES) this.previous.set(prop, body.style.getPropertyValue(prop));
				const dark = body.dataset.dsDarkTheme !== void 0;
				const tint = this.palette !== null ? dark ? this.palette.scrimDark : this.palette.scrimLight : dark ? NEUTRAL_SCIM.dark : NEUTRAL_SCIM.light;
				const dim = "rgba(0, 0, 0, " + String(this.dimValue / 100) + ")";
				const dimGradient = "linear-gradient(" + dim + ", " + dim + ")";
				const tintGradient = "linear-gradient(" + tint + ", " + tint + ")";
				const photoLayer = "url(\"" + descriptor.url + "\")";
				this.lastImage = dimGradient + ", " + tintGradient + ", " + photoLayer;
				setBodyMarked(body, true);
				body.style.setProperty("background-image", this.lastImage);
				body.style.setProperty("background-size", "100% 100%, 100% 100%, " + (this.fitValue === "contain" ? "contain" : "cover"));
				body.style.setProperty("background-position", "center, center, center");
				body.style.setProperty("background-repeat", "no-repeat");
				body.style.setProperty("background-attachment", "fixed");
				this.syncBlur();
				if (this.autoAccentValue) {
					if (this.palette === null || this.palettePhotoId !== descriptor.id) this.scheduleAccent(descriptor);
				} else this.clearAccent();
			}
			scheduleAccent(descriptor) {
				const image = new Image();
				const run = () => {
					if (this.disposed) return;
					const current = this.activeDescriptor();
					if (current === null || current.id !== descriptor.id) return;
					try {
						const scale = Math.min(1, SAMPLE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
						const canvas = document.createElement("canvas");
						canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
						canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
						const context = canvas.getContext("2d");
						if (context === null) return;
						context.drawImage(image, 0, 0, canvas.width, canvas.height);
						const data = context.getImageData(0, 0, canvas.width, canvas.height);
						this.palette = samplePalette({
							data: data.data,
							width: data.width,
							height: data.height
						});
						this.palettePhotoId = descriptor.id;
						this.applyPalette();
						this.paintBackdrop(descriptor);
						this.publish();
					} catch {
						this.clearAccent();
					}
				};
				if (image.complete && image.naturalWidth > 0) run();
				else {
					image.addEventListener("load", run, { once: true });
					image.addEventListener("error", () => {
						this.clearAccent();
					}, { once: true });
				}
				image.src = descriptor.url;
			}
			applyPalette() {
				if (this.palette === null) return;
				const style = document.body.style;
				style.setProperty("--dsw-photo-accent", this.palette.accent);
				style.setProperty("--dsw-photo-accent-soft", this.palette.accentSoft);
				style.setProperty("--dsw-photo-accent-contrast", this.palette.accentContrast);
			}
			clearAccent() {
				this.palette = null;
				this.palettePhotoId = null;
				const style = document.body.style;
				for (const name of ACCENT_VARS) style.removeProperty(name);
			}
			/** True when the conversation pane hosts at least one message row. */
			hasConversationContent() {
				return document.querySelector(CONVERSATION_CONTENT_SELECTOR) !== null;
			}
			/** The blur to paint right now, depending on mode and conversation state. */
			effectiveBlur() {
				if (this.blurModeValue === "split") return this.hasConversationContent() ? this.blurContentValue : this.blurEmptyValue;
				return this.blurValue;
			}
			/**
			* Create/update the fixed backdrop-filter blur element, or remove it. In
			* split mode it also wires (or tears down) the lazy conversation-content
			* observer so the empty/content blur flips live as messages appear.
			*/
			syncBlur() {
				const effective = this.activeDescriptor() !== null ? this.effectiveBlur() : 0;
				if (effective <= 0) {
					if (this.blurElement !== null) {
						this.blurElement.remove();
						this.blurElement = null;
					}
				} else {
					if (this.blurElement === null) {
						const element = document.createElement("div");
						element.style.position = "fixed";
						element.style.inset = "0";
						element.style.zIndex = "-1";
						element.style.pointerEvents = "none";
						element.setAttribute("aria-hidden", "true");
						element.setAttribute("data-dsh-photo-blur", "");
						this.blurElement = element;
						document.body.appendChild(element);
					}
					const blur = "blur(" + effective + "px)";
					this.blurElement.style.backdropFilter = blur;
					this.blurElement.style.setProperty("-webkit-backdrop-filter", blur);
				}
				if (this.blurModeValue === "split" && this.activeDescriptor() !== null) this.ensureConversationObserver();
				else this.disconnectConversationObserver();
			}
			/** Install the conversation-content observer lazily (split mode only). */
			ensureConversationObserver() {
				if (this.disposed || this.conversationObserver !== null) return;
				this.conversationObserver = new MutationObserver(() => this.scheduleConversationRecheck());
				this.conversationObserver.observe(document.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["class"]
				});
			}
			disconnectConversationObserver() {
				if (this.conversationRafId !== null) {
					cancelAnimationFrame(this.conversationRafId);
					this.conversationRafId = null;
				}
				this.conversationObserver?.disconnect();
				this.conversationObserver = null;
			}
			/** Coalesce burst mutations into one rAF-delayed blur recheck. */
			scheduleConversationRecheck() {
				if (this.disposed || this.conversationRafId !== null) return;
				this.conversationRafId = requestAnimationFrame(() => {
					this.conversationRafId = null;
					if (this.disposed) return;
					this.syncBlur();
					this.publish();
				});
			}
			/** Remove the painted backdrop + blur and restore the original body style. */
			clearBackdrop() {
				const body = document.body;
				setBodyMarked(body, false);
				for (const prop of BACKDROP_PROPERTIES) {
					const saved = this.previous.get(prop);
					if (saved !== void 0 && saved !== "") body.style.setProperty(prop, saved);
					else body.style.removeProperty(prop);
				}
				this.previous.clear();
				this.lastImage = "";
				if (this.blurElement !== null) {
					this.blurElement.remove();
					this.blurElement = null;
				}
				this.disconnectConversationObserver();
				this.clearAccent();
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace owned by this plugin. */
		const NS = "photoSkins";
		/** Required services: slots + locale (plugin card) and settingsScope + its transport (photo persistence). */
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"connection",
			"remote"
		];
		/**
		* Register the photo-skins dictionaries, the body scope attribute, and the
		* Photo skins card as a first-level settings section.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "photo-skins: dictionaries");
			ctx.effect(() => {
				document.body.dataset.dshPhotoSkins = "";
				return () => {
					delete document.body.dataset.dshPhotoSkins;
				};
			}, "photo-skins: body scope");
			const scope = (ctx.get("webUiSettings") ?? ctx.settingsScope).bind({ namespace: PHOTO_SKINS_NS });
			const controller = new PhotoSkinController(scope);
			ctx.effect(() => () => controller.dispose(), "photo-skins: controller dispose");
			let bootstrapping = false;
			const bootstrap = () => {
				const selectedId = controller.selection();
				if (selectedId === "" || controller.activeId() === selectedId || bootstrapping) return;
				bootstrapping = true;
				fetch("/api/photo-skins/list").then(async (response) => {
					const payload = await response.json().catch(() => null);
					if (payload?.ok === true && Array.isArray(payload.photos)) controller.sync(payload.photos.find((item) => item.id === selectedId) ?? null);
				}).catch(() => {}).finally(() => {
					bootstrapping = false;
				});
			};
			bootstrap();
			scope.subscribe(bootstrap);
			const injected = () => ({ photoSkin: controller });
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "photo-skins",
				order: 121,
				label: () => ctx.locale.bind("photoSkins")("title"),
				locale: "photoSkins",
				inject: injected
			}, PhotoSkinsPanel));
		}
		//#endregion
		exports.NS = NS;
		exports.PhotoSkinController = PhotoSkinController;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
