import type FloatingToc from "src/main";
import {
    App,
    Notice,
    requireApiVersion,
    MarkdownView,
    Component,
    HeadingCache,
    MarkdownRenderer,
    ButtonComponent,
    debounce,
} from "obsidian";
import {
    toggleCollapse,
    hasChildHeading,
    collapseHeading,
    expandHeading,
    toggleAllHeadings,
} from "./toggleCollapse";
import { t } from 'src/translations/helper';

export async function renderHeader(
    plugin: FloatingToc,
    view: MarkdownView,
    source: string,
    container?: HTMLElement,
    notePath?: string,
    component?: Component | null
) {

    // 有序列表
    const regex = /^(?:\s*)[0-9]+\.\s/;
    // 无序列表
    const regex2 = /^(?:\s*)[\-\+]\s/;
    let m;
    let prelist = "";
    if ((m = regex.exec(source)) !== null) {
        prelist = m[0];
        source = source.replace(regex, "");
    } else if ((m = regex2.exec(source)) !== null) {
        prelist = m[0];
        source = source.replace(regex2, "");
    }
    const index = Number(container.parentElement.getAttribute("data-id"));
    const level = Number(container.parentElement.getAttribute("data-level"));

    const clickHandler = (e: MouseEvent) => {
        e.stopImmediatePropagation(); // 阻止后续相同类型事件处理函数
        toggleCollapse(
            e,
            container.parentElement,
            plugin.settings.expandAllSubheadings
        );
    };

    // 如果有子标题则用属性标记，然后在css里用::before显示特殊符号

    // container.parentElement.addEventListener("click", clickHandler);
    // if (hasChildHeading(index, plugin.headingdata)) {
    //         if (level >= plugin.settings.defaultCollapsedLevel ) {
    //             container.parentElement.setAttribute("isCollapsed", "true");
    //         } else {
    //             container.parentElement.setAttribute("isCollapsed", "false");
    //         }
    //     }
    // if (level > plugin.settings.defaultCollapsedLevel ) {
    //     container.parentElement.style.display ="none";
    //      }
    container.parentElement.addEventListener("click", clickHandler);

    // 如果有子标题则用属性标记，然后在css里用::before显示特殊符号
    if (!container.parentElement.hasAttribute("isCollapsed")) {
        if (hasChildHeading(index, plugin.headingdata)) {
            container.parentElement.setAttribute("isCollapsed", "false");
        }
    } else {
        if (!hasChildHeading(index, plugin.headingdata)) {
            container.parentElement.removeAttribute("isCollapsed");
            // 取消点击事件
            container.parentElement.removeEventListener("click", clickHandler);
        }
    }

    let subcontainer = container;
    component = new Component();
    await MarkdownRenderer.renderMarkdown(
        source,
        subcontainer,
        notePath,
        component
    );
    if (subcontainer) {
        // heading-list-item .div 里面的标题渲染完毕, 可以显示伪元素了
        subcontainer.classList.add("heading-rendered");
    }

    let atag = subcontainer.createEl("a");
    atag.addClass("text");
    atag.onclick = function (event) {
        event.stopPropagation();
        let startline =
            parseInt(subcontainer.parentElement.getAttribute("data-line")) ?? 0;
        if (event.ctrlKey || event.metaKey) {
            foldHeader(view, startline);
        } else {
            openFiletoline(view, startline);
            let prevLocation =
                subcontainer.parentElement.parentElement.querySelector(
                    ".text-wrap.located"
                );
            if (prevLocation) {
                prevLocation.removeClass("located");
            }
            subcontainer.addClass("located");
        }
    };
    let par = subcontainer.querySelector("p");
    if (par) {
        const regex = /<a[^>]*>|<\/[^>]*a>/gm; //删除所有a标签
        //const regex = /(?<=\>[^<]*?) /g; //删除所有空白符
        if (prelist)
            atag.innerHTML = prelist + par.innerHTML.replace(regex, "");
        else atag.innerHTML = par.innerHTML.replace(regex, "");
        subcontainer.removeChild(par);
        if (plugin.settings.isTooltip) {
            subcontainer.setAttribute("aria-label", source);
            if (plugin.settings.positionStyle == "right")
                subcontainer.setAttribute("aria-label-position", "left");
            if (plugin.settings.positionStyle == "left")
                subcontainer.setAttribute("aria-label-position", "right");
            if (plugin.settings.positionStyle == "both")
                subcontainer.setAttribute("aria-label-position", "top");
        }
    }
}

export async function createLi(
    plugin: FloatingToc,
    view: MarkdownView,
    ul_dom: HTMLElement | DocumentFragment,
    heading: HeadingCache,
    index: number
) {
    // 检查是否是大型文档
    // const isLargeDocument = plugin.headingdata && plugin.headingdata.length > 100;
    if (!heading) return;
    const li_dom = ul_dom.createEl("li");
    li_dom.addClass("heading-list-item");
    li_dom.setAttribute("data-level", heading?.level?.toString() ?? "");
    li_dom.setAttribute("data-id", index.toString());
    li_dom.setAttribute("data-line", heading?.position?.start?.line?.toString() ?? "");
    const text_dom = li_dom.createEl("div");
    text_dom.addClass("text-wrap");

    // if (isLargeDocument) {

    //     // 对于大型文档，使用简化的渲染方式以提高性能
    //     // 直接创建文本元素而不使用Markdown渲染
    //     const textEl = text_dom.createEl("a");
    //     textEl.addClass("text");
    //     textEl.textContent = heading.heading;

    //     // 添加点击事件
    //     textEl.onclick = function(event: MouseEvent) {
    //         event.stopPropagation();
    //         const startline = heading.position.start.line;

    //         if (event.ctrlKey || event.metaKey) {
    //             foldHeader(view, startline);
    //         } else {
    //             openFiletoline(view, startline);

    //             const prevLocation = ul_dom.querySelector(".text-wrap.located");
    //             if (prevLocation) {
    //                 prevLocation.removeClass("located");
    //             }
    //             text_dom.addClass("located");
    //         }
    //     };

    //     // 检查是否有子标题
    //     if (hasChildHeading(index, plugin.headingdata)) {
    //         li_dom.setAttribute("isCollapsed", "false");

    //         // 添加折叠/展开点击事件
    //         li_dom.addEventListener("click", (e: MouseEvent) => {
    //             e.stopPropagation();
    //             toggleCollapse(e, li_dom, plugin.settings.expandAllSubheadings);
    //         });
    //     }
    // } else {
    // 对于标题数量较少的情况，使用完整的Markdown渲染
    await renderHeader(plugin, view, heading.heading, text_dom, view.file.path, null);


    const line_dom = li_dom.createEl("div");
    line_dom.addClass("line-wrap");
    line_dom.createDiv().addClass("line");
}

const openFiletoline = (view: MarkdownView, lineNumber: number) => {
    //const current_file = plugin.app.workspace.getActiveFile()
    //     console.log("line number", lineNumber);
    // let leaf = plugin.app.workspace.getLeaf(false);
    view.leaf.openFile(view.file, {
        eState: { line: lineNumber },
    });
};
const foldHeader = (view: MarkdownView, startline: number) => {

    // const view = plugin.app.workspace.getActiveViewOfType(MarkdownView)
    const existingFolds = view?.currentMode.getFoldInfo()?.folds ?? [];

    const headfrom = startline;
    let index = 0;
    if (
        existingFolds.some((item, idx) => {
            index = idx;
            return item.from == headfrom;
        })
    )
        //标题原来已经折叠状态
        existingFolds.splice(index, 1); //删除折叠状态
    else {
        let headingsAtLevel = {
            from: startline,
            to: startline + 1,
        };
        existingFolds.push(headingsAtLevel);
    }

    view?.currentMode.applyFoldInfo({
        folds: existingFolds,
        lines: view.editor.lineCount(),
    });
    view?.onMarkdownFold();
};


export function creatToc(app: App, plugin: FloatingToc): void {
    const genToc = (
        currentleaf: HTMLElement,
        floatingTocWrapper: HTMLDivElement
    ) => {
        const current_file = app.workspace.getActiveFile();

        let heading = app.metadataCache.getFileCache(current_file).headings;
        let cleanheading: HeadingCache[] = [];
        heading?.map((item: HeadingCache) => {
            item.heading = item.heading.replace(/<\/?[\s\S]*?(?:".*")*>/g, ""); // clean html tags
            cleanheading.push(item);
        });
        plugin.headingdata = cleanheading;
        if (plugin.headingdata.length == 0) return;
        if (plugin.settings.positionStyle == "right")
            floatingTocWrapper.addClass("floating-right"),
                floatingTocWrapper.removeClass("floating-left"),
                floatingTocWrapper.removeClass("floating-both");
        else if (plugin.settings.positionStyle == "left")
            floatingTocWrapper.addClass("floating-left"),
                floatingTocWrapper.removeClass("floating-rigth"),
                floatingTocWrapper.removeClass("floating-both");
        else if (plugin.settings.positionStyle == "both")
            floatingTocWrapper.addClass("floating-both"),
                floatingTocWrapper.removeClass("floating-left"),
                floatingTocWrapper.removeClass("floating-rigth");
        if (plugin.settings.isLeft)
            floatingTocWrapper.removeClass("alignLeft"),
                floatingTocWrapper.addClass("alignLeft");
        else floatingTocWrapper.removeClass("alignLeft");
        let ul_dom = floatingTocWrapper.createEl("ul");
        ul_dom.addClass("floating-toc");


        let toolbar = floatingTocWrapper.createEl("div");

        // 创建 toolbar 的内容移到这里
        createToolbar(plugin, toolbar as HTMLElement, floatingTocWrapper as HTMLElement);



        if (plugin.settings.ignoreHeaders) {
            let levelsToFilter = plugin.settings.ignoreHeaders.split("\n");
            plugin.headingdata = app.metadataCache
                .getFileCache(current_file)
                .headings?.filter(
                    (item) => !levelsToFilter.includes(item.level.toString())
                );
        }
        // plugin.headingdata = app.metadataCache.getFileCache(current_file).headings.slice(1);

        // 分批渲染标题，避免UI阻塞
        const renderHeadings = () => {
            const totalHeadings = plugin.headingdata.length;
            const view = app.workspace.getActiveViewOfType(MarkdownView);

            // 如果标题数量很多，使用分批渲染
            if (totalHeadings > 50) {
                // 首先渲染前20个标题，让用户能够立即看到内容
                const initialBatchSize = 20;
                const initialBatch = plugin.headingdata.slice(0, initialBatchSize);

                // 创建一个加载指示器
                const loadingIndicator = activeDocument.createElement("div");
                loadingIndicator.className = "toc-loading-indicator";
                loadingIndicator.textContent = `Loading... (${initialBatchSize}/${totalHeadings})`;
                loadingIndicator.style.textAlign = "center";
                loadingIndicator.style.padding = "8px";
                loadingIndicator.style.color = "var(--text-muted)";
                loadingIndicator.style.fontSize = "0.8em";
                loadingIndicator.style.position = "fixed";
                loadingIndicator.style.top = "45px";
                // 渲染初始批次
                initialBatch.forEach((heading: HeadingCache, index: number) => {

                    createLi(plugin, view, ul_dom, heading, index);
                });

                // 添加加载指示器
                ul_dom.appendChild(loadingIndicator);

                // 使用requestIdleCallback在空闲时间渲染剩余标题
                let nextIndex = initialBatchSize;
                const batchSize = 20; // 每批处理的标题数量

                const renderNextBatch = () => {

                    // 确定这一批次要渲染的数量
                    const batchEndIndex = Math.min(nextIndex + batchSize, totalHeadings);

                    // 更新加载指示器
                    loadingIndicator.textContent = `加载中... (${batchEndIndex}/${totalHeadings})`;

                    // 渲染这一批次
                    for (let i = nextIndex; i < batchEndIndex; i++) {
                        createLi(plugin, view, ul_dom, plugin.headingdata[i], i);
                    }

                    // 更新下一批次的起始索引
                    nextIndex = batchEndIndex;

                    // 安排下一批次的渲染
                    if (nextIndex < totalHeadings) {
                        // 使用requestAnimationFrame确保UI响应性
                        requestAnimationFrame(() => {
                            // 使用setTimeout给UI一些时间来响应
                            setTimeout(renderNextBatch, 10);
                        });
                    } else {
                        // 所有标题都已渲染完成，移除加载指示器
                        loadingIndicator.remove();
                    }
                };

                // 开始渲染剩余批次
                setTimeout(renderNextBatch, 50);
            } else {
                // 对于少量标题，直接一次性渲染
                plugin.headingdata.forEach((heading: HeadingCache, index: number) => {
                    createLi(plugin, view, ul_dom, heading, index);
                });
            }
        };

        // 执行渲染
        renderHeadings();

        currentleaf
            ?.querySelector(".markdown-source-view")
            ?.insertAdjacentElement("beforebegin", floatingTocWrapper) ||
            currentleaf
                ?.querySelector(".markdown-reading-view")
                ?.insertAdjacentElement("beforebegin", floatingTocWrapper);
    };
    let Markdown = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (Markdown) {
        requireApiVersion("0.15.0")
            ? (activeDocument = activeWindow.document)
            : (activeDocument = window.document);
        let view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            let float_toc_dom =
                view.contentEl?.querySelector(".floating-toc-div");
            if (!float_toc_dom) {
                const floatingTocWrapper = createEl("div");
                floatingTocWrapper.addClass("floating-toc-div");
                // 移除所有可能的指示条样式类名
                plugin.BAR_STYLE_CLASSES.forEach(className => {
                    activeDocument.body.removeClass(className);
                });
                if (plugin.settings.isDefaultPin)
                    floatingTocWrapper.addClass("pin");
                if (plugin.settings.isDefaultHide)
                    floatingTocWrapper.addClass("hide");
                if (plugin.settings.enableHeadingNowrap)
                    activeDocument.body.addClass("enable-heading-nowrap");
                if (plugin.settings.enableBarHeadingText)
                    activeDocument.body.addClass("enable-bar-heading-text");



                // 添加当前选择的指示条样式类名
                activeDocument.body.addClass(plugin.settings.barStyle || "enable-edge-style");

                genToc(view.contentEl, floatingTocWrapper);
                plugin.updateTocWidth(floatingTocWrapper as HTMLElement, plugin.headingdata);
                
                // 初始化搜索功能
                if (plugin.search) {
                    plugin.search.initSearch(floatingTocWrapper);
                }
 
            } else return;
        }
    }
}

export function createToolbar(plugin: FloatingToc, toolbar: HTMLElement, float_toc_dom: HTMLElement) {
    toolbar.addClass("toolbar");

    toolbar.addClass("hide");

    let pinButton = new ButtonComponent(toolbar);
    pinButton
        .setIcon("pin")
        .setTooltip("pin")
        .onClick(() => {
            if (float_toc_dom.classList.contains("pin"))
                float_toc_dom.removeClass("pin");
            else float_toc_dom.addClass("pin");
        });

    // 添加搜索按钮
    let searchButton = new ButtonComponent(toolbar);
    searchButton
        .setIcon("search")
        .setTooltip(t("Search in TOC "))
        .setClass("search")
        .onClick(() => {
            // 启动搜索功能
            if (plugin.search) {
                plugin.search.startSearchFromButton();
            }
        });

    let topBuuton = new ButtonComponent(toolbar);
    topBuuton
        .setIcon("double-up-arrow-glyph")
        .setTooltip("Scroll to Top")
        .setClass("top")
        .onClick(() => {
            const view =
                this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view) {
                view.setEphemeralState({ scroll: 0 });
            }
        });
    let bottomBuuton = new ButtonComponent(toolbar);
    bottomBuuton
        .setIcon("double-down-arrow-glyph")
        .setTooltip("Scroll to Bottom")
        .setClass("bottom")
        .onClick(async () => {
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
        });
    let CopyBuuton = new ButtonComponent(toolbar);
    CopyBuuton.setIcon("copy")
        .setTooltip("copy TOC to clipboard")
        .setClass("copy")
        .onClick(async () => {
            let headers = plugin.headingdata.map((h: HeadingCache) => {
                const indent = "    ".repeat(h.level - 1);
                // 创建 markdown 列表项和双链格式
                return `${indent}- [[#${h.heading}]]`;
            });
            await navigator.clipboard.writeText(headers.join("\n"));
            new Notice("TOC Copied");
        });
    const toggleButton = new ButtonComponent(toolbar)
        .setIcon("chevron-down")
        .setTooltip("Collapse/Expand all headings")
        .setClass("toggle-all")
        .onClick(() => {


            const isAllExpanded = float_toc_dom.getAttribute("data-all-expanded") === "true";
            toggleButton.setIcon(isAllExpanded ? "chevron-right" : "chevron-down");
            // 使用新的 toggleAllHeadings 函数
            toggleAllHeadings(float_toc_dom as HTMLElement, !isAllExpanded);

            // 更新全局状态
            float_toc_dom.setAttribute("data-all-expanded", (!isAllExpanded).toString());



        });



}