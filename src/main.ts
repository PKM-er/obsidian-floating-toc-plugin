import {
	debounce,
	Notice,
	requireApiVersion,
	MarkdownView,
	Plugin,
	HeadingCache,
	App,
} from "obsidian";
import { creatToc, createLi, createToolbar } from "src/components/floatingtocUI";
import { FlotingTOCSettingTab } from "src/settings/settingsTab";
import { FlotingTOCSetting, DEFAULT_SETTINGS } from "src/settings/settingsData";
import {  hasChildHeading } from "src/components/toggleCollapse";
import { FloatingTocSearch } from "src/components/search";

let activeDocument: Document;
let line = 0;
export function selfDestruct() {
	requireApiVersion("0.15.0")
		? (activeDocument = activeWindow.document)
		: (activeDocument = window.document);
	const float_toc_dom = activeDocument.querySelectorAll(".floating-toc-div");
	float_toc_dom.forEach((element) => {
		if (element) {
			element.remove();
		}
	});
}
 

export function refresh_node(plugin: FloatingToc, view: MarkdownView) {
	requireApiVersion("0.15.0")
		? (activeDocument = activeWindow.document)
		: (activeDocument = window.document);

	const float_toc_dom = view.contentEl?.querySelector(".floating-toc-div");
	if (!float_toc_dom) return false;
 
	let toolbar = float_toc_dom.querySelector(".toolbar");
    if (!toolbar) {
        toolbar = float_toc_dom.createEl("div");
     
        // 创建 toolbar 的内容移到这里
        createToolbar(plugin, toolbar as HTMLElement, float_toc_dom as HTMLElement);
    }

	let ul_dom = float_toc_dom.querySelector("ul.floating-toc") as HTMLElement;
	if (!ul_dom) {
		ul_dom = float_toc_dom.createEl("ul");
		ul_dom.addClass("floating-toc");
	}

	// 1. 预处理 headingdata，避免重复过滤
	let headingdata = plugin.headingdata;
	if (plugin.settings.ignoreHeaders) {
		const levelsToFilter = new Set(plugin.settings.ignoreHeaders.split("\n"));
		headingdata = plugin.headingdata?.filter(
			(item: { level: { toString: () => string } }) =>
				!levelsToFilter.has(item.level.toString())
		);
	}
	if (!headingdata) {
		ul_dom.remove();
		return false;
	}
  if (headingdata && headingdata.length > 0) {
		plugin.updateTocWidth(float_toc_dom as HTMLElement, headingdata);
    }
	// 2. 创建一个 Map 存储现有的 li 元素，避免重复查询
	const existingItems = new Map();
	const li_dom = float_toc_dom?.querySelectorAll("li.heading-list-item") as NodeListOf<HTMLElement>;
	li_dom.forEach((el) => {
		const key = `${el.getAttribute("data-level")}-${el.getAttribute("data-line")}-${(el.children[0] as HTMLElement).innerText}`;
		existingItems.set(key, el);
	});

	// 3. 使用 DocumentFragment 批量处理 DOM 操作
	const fragment = activeDocument.createDocumentFragment();
	const itemsToRemove = new Set(existingItems.values());

	// 4. 处理每个标题
	headingdata.forEach((heading: HeadingCache, i: number) => {
		const key = `${heading.level}-${heading.position.start.line}-${heading.heading}`;
		const existingItem = existingItems.get(key);

		if (existingItem) {
			// 标题已存在且内容相同，只更新折叠状态
			itemsToRemove.delete(existingItem);
			if (hasChildHeading(i, plugin.headingdata)) {
				if (!existingItem.hasAttribute("iscollapsed")) {
					existingItem.setAttribute("isCollapsed", "false");
				}
			} else if (existingItem.hasAttribute("iscollapsed")) {
				existingItem.removeAttribute("isCollapsed");
			}
			fragment.appendChild(existingItem);
		} else {
			// 创建新的标题项
			createLi(plugin, view, fragment, heading, i);
		}
	});

	// 5. 移除不再需要的项
	itemsToRemove.forEach(item => item.remove());

	// 6. 一次性更新 DOM
	ul_dom.replaceChildren(fragment);

	return true;
}
function siblingElems(elem: Element) {
	const nodes = [];
	if (elem?.previousElementSibling) {
		while ((elem = elem.previousElementSibling)) {
			if (elem.nodeType == 1) {
				nodes.push(elem);
			}
		}
	}
	return nodes;
}
function _handleScroll(app: App, plugin: FloatingToc, evt: Event): any {
	const target = evt.target as HTMLElement;
	if (
		target.parentElement?.classList.contains("cm-editor") ||
		target.parentElement?.classList.contains("markdown-reading-view")
	) {
		const view = app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;
		
		const current_line = view.currentMode.getScroll() ?? 0;
		const headings = plugin.headingdata;
		if (!headings || headings.length === 0) return;
		
		const floattoc = view.contentEl.querySelector(".floating-toc");
		if (!floattoc) return;
		
		// 1. 缓存DOM查询结果
		const headingItems = floattoc.querySelectorAll("li.heading-list-item");
		if (!headingItems.length) return;
		
		const firstHeadingItem = headingItems[0] as HTMLElement;
		const lastHeadingItem = headingItems[headingItems.length - 1] as HTMLElement;
		
		const firstline = parseInt(firstHeadingItem.getAttribute("data-line") || "0");
		const lastline = parseInt(lastHeadingItem.getAttribute("data-line") || "0");
		
		// 2. 使用二分查找代替线性搜索
		let targetLine = 0;
		let targetHeading = null;
		
		// 滚动到顶部的处理
		if (current_line <= 0) {
			targetLine = firstline;
		} else {
			// 使用二分查找快速定位当前滚动位置对应的标题
			let start = 0;
			let end = headings.length - 1;
			let foundIndex = -1;
			
			while (start <= end) {
				let mid = Math.floor((start + end) / 2);
				if (headings[mid].position.start.line <= current_line) {
					foundIndex = mid;
					start = mid + 1;
				} else {
					end = mid - 1;
				}
			}
			
			if (foundIndex !== -1) {
				targetLine = headings[foundIndex].position.start.line;
				targetHeading = headings[foundIndex];
			} else {
				targetLine = firstline;
			}
		}
		
		// 3. 优化DOM操作，减少重绘次数
		// 移除之前的高亮
		const prevLocation = floattoc.querySelector(".heading-list-item.located");
		if (prevLocation) {
			prevLocation.removeClass("located");
		}
		
		// 添加新的高亮
		const curLocation = floattoc.querySelector(`li[data-line='${targetLine}']`) as HTMLElement;
		if (!curLocation) return;
		
		curLocation.addClass("located");
		
		// 4. 批量处理类名更新
		const level = parseInt(curLocation.getAttribute("data-level") || "1");
		const adjustedLevel = level > 1 ? level - 1 : 1;
		
		const focusele = floattoc.querySelector(`li.focus`);
		if (focusele) {
			focusele.removeClass("focus");
		}
		
		// 5. 减少DOM遍历
		const siblings = siblingElems(curLocation);
		for (let i = 0; i < siblings.length; i++) {
			const element = siblings[i] as HTMLElement;
			if (element.dataset["level"] <= adjustedLevel.toString()) {
				element.addClass("focus");
				break;
			}
		}
		
		// 6. 使用requestAnimationFrame优化滚动
		requestAnimationFrame(() => {
			curLocation.scrollIntoView({ block: "nearest", behavior: "smooth" });
		});
	}
}
export default class FloatingToc extends Plugin {
	app: App;
	settings: FlotingTOCSetting;
	headingdata: any;
    private isUpdating = false;
    private lastRefreshTime = 0;
    private readonly REFRESH_COOLDOWN = 200; // 刷新冷却时间
    private currentFile: string | null = null;
    public search: FloatingTocSearch;
	public  BAR_STYLE_CLASSES = [
		"enable-bar-heading-text",
		"enable-heading-nowrap",
		"pin",
		"hide",
		"default-bar-style",
		"enable-edge-style",
		"enable-bar-icon",
		"enable-bold-bar",
		"enable-dot-style",
		"enable-square-style",
		"enable-vertical-line-style",
		"enable-hollow-line-style",
	  ];
	async onload() {
		requireApiVersion("0.15.0")
			? (activeDocument = activeWindow.document)
			: (activeDocument = window.document);
		await this.loadSettings();
		
		// 初始化搜索功能
		this.search = new FloatingTocSearch(this);
		
		const updateHeadingsForView = (view: MarkdownView) => {
			view
				? refresh_node(this, view)
					? false
					: creatToc(this.app, this)
				: false;
		};
		// let isLoadOnMobile = this.settings.isLoadOnMobile;
		// if (Platform.isMobileApp && isLoadOnMobile) {
		// 	console.log(`floating toc disable loading on mobile`);
		// 	return;
		// }
		this.addCommand({
			id: "pin-toc-panel",
			name: "Pinning the Floating TOC panel",
			icon: "pin",
			callback: async () => {
				let view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					let floatingTocWrapper =
						view.contentEl.querySelector(".floating-toc-div");
					if (floatingTocWrapper) {
						if (floatingTocWrapper.classList.contains("pin"))
							floatingTocWrapper.removeClass("pin");
						else floatingTocWrapper.addClass("pin");
					}
				}
			},
		});
		this.addCommand({
			id: "hide-toc-panel",
			name: "Hide/Show the Floating TOC panel",
			icon: "list",
			callback: async () => {
				let view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					let floatingTocWrapper =
						view.contentEl.querySelector(".floating-toc-div");
					if (floatingTocWrapper) {
						if (floatingTocWrapper.classList.contains("hide"))
							floatingTocWrapper.removeClass("hide");
						else floatingTocWrapper.addClass("hide");
					}
				}
			},
		});
		this.addCommand({
			id: "scroll-to-bottom",
			name: "Scroll to Bottom",
			icon: "double-down-arrow-glyph",
			callback: async () => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {


					const file = this.app.workspace.getActiveFile()
					const content = await (this.app as any).vault.cachedRead(file);
					const lines = content.split('\n');
					let numberOfLines = lines.length;
					//in preview mode don't count empty lines at the end
					if (view.getMode() === 'preview') {
						while (numberOfLines > 0 && lines[numberOfLines - 1].trim() === '') {
							numberOfLines--;
						}
					}
					view.currentMode.applyScroll((numberOfLines - 1))


				}
			},
		});
		this.addCommand({
			id: "scroll-to-top",
			name: "Scroll to Top",
			icon: "double-up-arrow-glyph",
			callback: async () => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					view.setEphemeralState({ scroll: 0 });
				}
			},
		});
		this.addCommand({
			id: "toggle-position-style",
			name: "Toggle Floating TOC Position (left/right)",
			icon: "switch",
			callback: () => {
				if (this.settings.positionStyle === "left") {
					this.settings.positionStyle = "right";
				} else if (this.settings.positionStyle === "right") {
					this.settings.positionStyle = "left";
				} else if (this.settings.positionStyle === "both") {
					new Notice("Position style set to both. Toogle position only works when fixed position (left or right) is selected.");
				}
				this.saveSettings();
				dispatchEvent(new Event("refresh-toc"))
			},
		});

		// 添加搜索快捷键命令
		this.addCommand({
			id: "search-in-toc",
			name: "Search in Floating TOC",
			icon: "search",
			hotkeys: [{ modifiers: ["Alt"], key: "F" }],
			callback: () => {
				if (this.search) {
					this.search.startSearchFromButton();
				}
			},
		});
 
 	
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return;

				const newFile = view.file?.path;
				if (newFile === this.currentFile) return; // 如果是同一个文件，跳过

				this.currentFile = newFile;
				const current_file = this.app.workspace.getActiveFile();
				  // 如果没有文件或文件没有标题，清除目录并返回
				  if (!current_file || !this.app.metadataCache.getFileCache(current_file)?.headings?.length) {
                    this.headingdata = null;
                    selfDestruct(); // 清除目录
                    return;
                }

				let heading = this.app.metadataCache.getFileCache(current_file)?.headings;
				if (!heading) 
					return;
		
				this.headingdata = heading;

				if (this.settings.ignoreHeaders) {
					let levelsToFilter = this.settings.ignoreHeaders.split("\n");
					this.headingdata = heading.filter(
						(item) => !levelsToFilter.includes(item.level.toString())
					);
				}
				refresh_outline(view, true); // 强制刷新
			})
		);
		/* 		this.registerEvent(this.app.workspace.on("file-open", (file) => {
					let view = this.app.workspace.getActiveViewOfType(MarkdownView)
					if (view) {
						const current_file = this.app.workspace.getActiveFile()
						let heading = this.app.metadataCache.getFileCache(current_file).headings
						globalThis.headingdata = heading
						console.log("refresh")
						refresh(view);
					}
				}
				)
				); */
				this.registerEvent(
					this.app.metadataCache.on("changed", () => {
						const view = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (!view || view.file?.path !== this.currentFile) return;
			
						const current_file = view.file;
						
						let heading = this.app.metadataCache.getFileCache(current_file)?.headings;
						// 如果文件不再有标题，清除目录
						if (!heading?.length) {
							this.headingdata = null;
							selfDestruct();
							return;
						}
			
						// 在比较前标准化两边的标题，移除所有 Markdown 语法
						const normalizedNewHeadings = heading.map(h => ({
							...h,
							heading: this.removeMarkdownSyntax(h.heading)
						}));
						
						const normalizedOldHeadings = this.headingdata ? 
							this.headingdata.map((h: HeadingCache) => ({
								...h,
								heading: this.removeMarkdownSyntax(h.heading)
							})) : null;
			
						// 检查标题结构是否有实质性变化
						const structuralChanges = this.hasStructuralHeadingChanges(
							normalizedNewHeadings, 
							normalizedOldHeadings
						);
			
						// 只有结构变化时才重建大纲
						if (structuralChanges) {
							this.headingdata = heading;
						
							if (this.settings.ignoreHeaders) {
								let levelsToFilter = this.settings.ignoreHeaders.split("\n");
								this.headingdata = heading.filter(
									(item) => !levelsToFilter.includes(item.level.toString())
								);
							}
							
							// 完全重建大纲
							refresh_outline(view, true);
						} else {
							// 只更新大纲中的行号信息，不重建结构
							this.updateOutlineLineNumbers(view, heading);
						}
					})
				);

		     // 修改原有的 refresh 函数定义
		const refresh_outline = (view: MarkdownView, force = false): any => {
			const now = Date.now();
			if (!force && now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
				return; // 在冷却时间内，除非强制刷新，否则跳过
			}
			this.lastRefreshTime = now;
			updateHeadingsForView(view);
		};
	
		 

		activeDocument.addEventListener(
			"scroll",
			(event) => {
				this.handleScroll(this.app, this, event);
			},
			true
		);
		this.addSettingTab(new FlotingTOCSettingTab(this.app, this));

		updateHeadingsForView(
			this.app.workspace.getActiveViewOfType(MarkdownView)
		);
		
			this.app.workspace.on("window-open", (leaf) => {
				console.log("window-open")
				leaf.doc.addEventListener(
					"scroll",
					(event) => {
						this.handleScroll(this.app, this, event);
					},
					true
				);
			});
		
		
		this.app.workspace.onLayoutReady(() => {
			this.app.workspace.trigger("parse-style-settings");
		});
	}

	public updateTocWidth =  debounce((float_toc_dom: HTMLElement, headingdata: HeadingCache[]) => {
	    // 18rem大约对应20个中文字符或30个英文字符
		
    
		// 快速估算最长标题的字符长度
		const maxLength = headingdata.reduce((maxLen, heading) => {
			// 快速估算实际显示长度
			const text = heading.heading;
			// 计算等效字符长度：中文算1，英文和数字算0.6
			const effectiveLength = text.split('')
				.reduce((len, char) => {
					return len + (/[\u4e00-\u9fa5]/.test(char) ? 1 : 0.6);
				}, 0);
			
	 
			// 返回最大长度
			return Math.max(maxLen, effectiveLength );
		}, 0);
		
	
	
		const maxTextWidth = Math.ceil(maxLength) + 'rem'; 
		activeDocument.body.style.setProperty('--actual-toc-width', `${maxTextWidth}`);
	   
	}, 100);

	private removeMarkdownSyntax(heading: string): string {
		if (!heading) return "";
		
		// 分步处理不同类型的 Markdown 语法
		let cleanedHeading = heading;
		
		// 1. 处理粗体和斜体
		cleanedHeading = cleanedHeading
			.replace(/\*\*(.*?)\*\*/g, "$1")    // 粗体 **text**
			.replace(/__(.*?)__/g, "$1")        // 粗体 __text__
			.replace(/\*(.*?)\*/g, "$1")        // 斜体 *text*
			.replace(/_(.*?)_/g, "$1");         // 斜体 _text_
		
		// 2. 处理代码和删除线
		cleanedHeading = cleanedHeading
			.replace(/`([^`]+)`/g, "$1")        // 行内代码 `code`
			.replace(/~~(.*?)~~/g, "$1");       // 删除线 ~~text~~
		
		// 3. 处理高亮
		cleanedHeading = cleanedHeading
			.replace(/==(.*?)==/g, "$1");       // 高亮 ==text==
		
		// 4. 处理链接
		cleanedHeading = cleanedHeading
			.replace(/\[(.*?)\]\([^\)]+\)/g, "$1")  // [text](url)
			.replace(/\[\[(.*?)(\|.*?)?\]\]/g, "$1"); // Wiki链接 [[page|text]]
		
		// 5. 处理HTML标签
		cleanedHeading = cleanedHeading
			.replace(/<[^>]+>/g, "");           // HTML标签
		
		// 6. 移除标题标记符号
		cleanedHeading = cleanedHeading
			.replace(/^#+\s+/, "");             // 标题前的 # 符号
		
		return cleanedHeading.trim();
	}
    // 添加辅助方法来比较标题是否发生变化
	private hasHeadingsChanged(newHeadings: HeadingCache[], oldHeadings: HeadingCache[]): boolean {
        if (!oldHeadings || newHeadings.length !== oldHeadings.length) return true;

        const normalizeHeading = (h: HeadingCache) => 
            `${h.heading}|${h.level}|${h.position.start.line}`;

           // 使用 every 而不是 some，这样更容易调试
		   const isUnchanged = newHeadings.every((newH, index) => {
            const oldH = oldHeadings[index];
            const newNormalized = normalizeHeading(newH);
            const oldNormalized = normalizeHeading(oldH);
            return newNormalized === oldNormalized;
        });

        // if (!isUnchanged) {
        //     console.log("Headings changed:", {
        //         old: oldHeadings.map(normalizeHeading),
        //         new: newHeadings.map(normalizeHeading)
        //     });
        // }

        return !isUnchanged;
    }
	private updateOutlineLineNumbers(view: MarkdownView, newHeadings: HeadingCache[]) {
		const float_toc_dom = view.contentEl?.querySelector(".floating-toc-div");
		if (!float_toc_dom) return;

		const li_items = float_toc_dom.querySelectorAll("li.heading-list-item") as NodeListOf<HTMLElement>;
		if (!li_items.length) return;

		// 创建一个标题文本到行号的映射
		const headingToLineMap = new Map();
		newHeadings.forEach(h => {
			const key = `${this.removeMarkdownSyntax(h.heading)}|${h.level}`;
			headingToLineMap.set(key, h.position.start.line);
		});

		// 只更新每个列表项的行号属性
		li_items.forEach(li => {
			const level = li.getAttribute("data-level");
			const textEl = li.querySelector(".text-wrap a.text") as HTMLElement;
			if (!textEl) return;
			
			const text = textEl.innerText;
			const key = `${text}|${level}`;
			
			if (headingToLineMap.has(key)) {
				const newLine = headingToLineMap.get(key);
				// 只在行号变化时更新
				if (li.getAttribute("data-line") !== newLine.toString()) {
					li.setAttribute("data-line", newLine.toString());
				}
			}
		});
	}
	private hasStructuralHeadingChanges(newHeadings: HeadingCache[], oldHeadings: HeadingCache[]): boolean {
		if (!oldHeadings || newHeadings.length !== oldHeadings.length) return true;
	 
		// 只比较标题文本和级别，不比较行号
		const normalizeForStructureCheck = (h: HeadingCache) => 
			`${this.removeMarkdownSyntax(h.heading)}|${h.level}`;

		// 检查标题内容或级别是否有变化
		return newHeadings.some((newH, index) => {
			const oldH = oldHeadings[index];
			return normalizeForStructureCheck(newH) !== normalizeForStructureCheck(oldH);
		});
	}

	handleScroll = (app: App, plugin: FloatingToc, evt: Event) =>
		debounce(_handleScroll(app, plugin, evt), 100);

	onunload() {
		requireApiVersion("0.15.0")
			? (activeDocument = activeWindow.document)
			: (activeDocument = window.document);
		
		// 清理滚动事件监听器
		try {
			activeDocument.removeEventListener(
				"scroll",
				(event) => {
					this.handleScroll(this.app, this, event);
				},
				true
			);
		} catch (e) {
			console.error("Error removing scroll event listener:", e);
		}
		
		// 清理虚拟列表和其他资源
		try {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				const floatingTocWrapper = view.contentEl?.querySelector(".floating-toc-div");
				if (floatingTocWrapper) {
					// 移除所有事件监听器
					const headingItems = floatingTocWrapper.querySelectorAll("li.heading-list-item");
					headingItems.forEach(item => {
						// 尝试移除所有可能的事件监听器
						const clone = item.cloneNode(true);
						if (item.parentNode) {
							item.parentNode.replaceChild(clone, item);
						}
					});
					
					// 清理自定义清理函数
					if ((floatingTocWrapper as any)._tocCleanup) {
						(floatingTocWrapper as any)._tocCleanup();
					}
				}
			}
		} catch (e) {
			console.error("Error cleaning up resources:", e);
		}
		
		// 移除所有浮动目录元素
		selfDestruct();
	}
	setHeadingdata(content: HeadingCache): void {
		this.headingdata = content;
	}
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
