import type FloatingToc from "src/main";
import { App, Setting, PluginSettingTab, ButtonComponent } from "obsidian";
import { POSITION_STYLES } from "src/settings/settingsData";
import { selfDestruct } from "src/main";
import { creatToc } from "src/components/floatingtocUI"
import { t } from 'src/translations/helper';
import { FlowList } from './flow-list';

export class FlotingTOCSettingTab extends PluginSettingTab {
  plugin: FloatingToc;
  appendMethod: string;

  constructor(app: App, plugin: FloatingToc) {
    super(app, plugin);
    this.plugin = plugin;
    addEventListener("refresh-toc", () => {
      selfDestruct();
      creatToc(app, this.plugin);
    });
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // 标题和作者信息
    containerEl.createEl("h1", { text: "Obsidian Floating TOC " });
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "Author: Cuman ✨",
      href: "https://github.com/cumany",
    })
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "Readme:中文",
      href: "https://pkmer.cn/Pkmer-Docs/10-obsidian/obsidian%E7%A4%BE%E5%8C%BA%E6%8F%92%E4%BB%B6/floating-toc/",
    })
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "|English  ",
      href: "https://github.com/cumany/obsidian-floating-toc-plugin/blob/master/README.md",
    });

    // 提示信息
    let tipsE1 = containerEl.createEl("div");
    tipsE1.addClass('callout');
    tipsE1.setAttribute("data-callout", "info");
    let tips_titleE1 = tipsE1.createEl("div", { text: "🔑TIPS:" })
    tips_titleE1.addClass("callout-title")
    tips_titleE1.createEl("br");
    let tips_contentE1 = tipsE1.createEl("div",{
      text: t("ctrl + click on the floating toc to collapse/expand the header.")
    })
    tips_contentE1.addClass("callout-content");

    // 创建标签页容器
    const tabContainer = containerEl.createEl("div", { cls: "floating-toc-tabs" });
    const tabHeader = tabContainer.createEl("div", { cls: "floating-toc-tab-header" });
    const tabContent = tabContainer.createEl("div", { cls: "floating-toc-tab-content" });

    // 创建标签页
    const tabs = ["🎢TOC Display", "🎮Interaction", "🎨Style Settings"];
    const tabElements: { [key: string]: HTMLElement } = {};
    
    tabs.forEach((tabName) => {
      const tab = tabHeader.createEl("div", { cls: "floating-toc-tab" });
      tab.setText(tabName);
      tab.addEventListener("click", () => {
        // 移除所有活动状态
        tabHeader.querySelectorAll(".floating-toc-tab").forEach((t) => t.removeClass("active"));
        tabContent.querySelectorAll(".floating-toc-tab-pane").forEach((p) => p.removeClass("active"));
        // 添加当前活动状态
        tab.addClass("active");
        tabElements[tabName].addClass("active");
      });
      
      const pane = tabContent.createEl("div", { cls: "floating-toc-tab-pane" });
      tabElements[tabName] = pane;
    });

    // 设置第一个标签为默认活动
    tabHeader.querySelector(".floating-toc-tab")?.addClass("active");
    tabContent.querySelector(".floating-toc-tab-pane")?.addClass("active");

    
    
    
    // 目录显示设置
    const tocDisplay = tabElements["🎢TOC Display"];
    tocDisplay.createEl("h2", { text: t("TOC Display Settings") });

    let posE1 = new Setting(tocDisplay)
    .setName(t('Floating TOC position'))
    .setDesc(this.plugin.settings.positionStyle == "both" 
      ? t("When the panel is split left and right, the right side of the layout is aligned right and the left side of the panel is aligned left.")
      : this.plugin.settings.positionStyle == "right"
      ? t("Floating TOC position, on the right side of the notes")
      : t('Floating TOC position, default on the left side of the notes'));
  
  posE1.addDropdown((dropdown) => {
    let posotions: Record<string, string> = {};
    POSITION_STYLES.map((posotion: string) => (posotions[posotion] = posotion));
    dropdown.addOptions(posotions);
    dropdown
      .setValue(this.plugin.settings.positionStyle)
      .onChange((positionStyle: string) => {
        this.plugin.settings.positionStyle = positionStyle;
        this.plugin.saveSettings();
        setTimeout(() => {
          this.display();
          dispatchEvent(new Event("refresh-toc"));
        }, 100);
      });
  });

  if (this.plugin.settings.positionStyle != "left") {
    new Setting(tocDisplay)
      .setName(t('Left alignment of TOC text'))
      .setDesc(t("whether the text in TOC is left aligned"))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isLeft)
        .onChange((value) => {
          this.plugin.settings.isLeft = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            this.display();
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));
  }

  new Setting(tocDisplay)
    .setName(t('Default Hide TOC'))
    .setDesc(t("When enabled, TOC will be hidden by default when plugin starts"))
    .addToggle(toggle => toggle.setValue(this.plugin.settings?.isDefaultHide)
      .onChange((value) => {
        this.plugin.settings.isDefaultHide = value;
        this.plugin.saveSettings();
        setTimeout(() => {
          dispatchEvent(new Event("refresh-toc"));
        }, 100);
      }));

    new Setting(tocDisplay)
      .setName(t("Expand All Subheadings Recursively"))
      .setDesc(t("When disabled, only direct subheadings will be expanded"))
      .addToggle(toggle => toggle.setValue(this.plugin.settings.expandAllSubheadings)
        .onChange((value) => {
          this.plugin.settings.expandAllSubheadings = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));

    new Setting(tocDisplay)
      .setName(t('Hide heading level'))
      .setDesc(t("Whichever option is selected, the corresponding heading level will be hidden"));
    
    let HeadList = new FlowList(tocDisplay);
    const headerLevel=[1,2,3,4,5,6]
    headerLevel.forEach(async (level) => {   
      let levelsToFilter = this.plugin.settings.ignoreHeaders.split("\n");
      let isChecked = levelsToFilter.includes(level.toString());
      HeadList.addItem(level.toString(), level.toString(), isChecked, (value) => {
        this.plugin.settings.ignoreHeaders = HeadList.checkedList.join('\n');
        this.plugin.saveSettings();
        setTimeout(() => {
          dispatchEvent(new Event("refresh-toc"));
        }, 100);
      });
    });

    // 交互设置
    const interaction = tabElements["🎮Interaction"];
    interaction.createEl("h2", { text: t("Interaction Settings") });

    new Setting(interaction)
      .setName(t('Default Pin'))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isDefaultPin)
        .onChange((value) => {
          this.plugin.settings.isDefaultPin = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));

    new Setting(interaction)
      .setName(t('Enable Tooltip'))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isTooltip)
        .onChange((value) => {
          this.plugin.settings.isTooltip = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));

  
    // 样式设置
    const styleSettings = tabElements["🎨Style Settings"];
    styleSettings.createEl("h2", { text: t("Style Settings") });

    new Setting(styleSettings)
      .setName(t("Header single line display"))
      .setDesc(t("When enabled, heading text will be displayed in a single line"))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.enableHeadingNowrap)
        .onChange((value) => {
          this.plugin.settings.enableHeadingNowrap = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));

    new Setting(styleSettings)
      .setName(t("Indicator bar style"))
      .setDesc(t("Choose the style of the indicator bar"))
      .addDropdown(dropdown => {
        dropdown
        .addOption("default-bar-style", "Default")
        .addOption("enable-edge-style", "Edge")
        .addOption("enable-bar-icon", "Icon")
        .addOption("enable-bold-bar", "Bold")
        .addOption("enable-dot-style", "Dot")
        .addOption("enable-square-style", "Square")
        .addOption("enable-vertical-line-style", "Vertical Line")
        .addOption("enable-hollow-line-style", "Hollow Line")

          .setValue(this.plugin.settings.barStyle)
          .onChange((value) => {
            this.plugin.settings.barStyle = value;
            this.plugin.saveSettings();
            setTimeout(() => {
              dispatchEvent(new Event("refresh-toc"));
            }, 100);
          });
      });

    new Setting(styleSettings)
      .setName(t("Show heading text next to indicator bar"))
      .setDesc(t("When enabled, heading text will be shown next to the indicator bar"))
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.enableBarHeadingText)
        .onChange((value) => {
          this.plugin.settings.enableBarHeadingText = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));
    styleSettings.createEl("h2", { text: t("More Style Settings") });
    let styleE1 = styleSettings.createEl("div");
    styleE1.addClass('callout');
    styleE1.setAttribute("data-callout", "warning");
    let contentE1 = styleE1.createEl("div")
    contentE1.addClass("callout-content");
    
    const isEnabled = this.app.plugins.enabledPlugins.has("obsidian-style-settings");
    if (isEnabled) {
      contentE1.createEl("br");
      let button = new ButtonComponent(contentE1);
      button
        .setIcon("palette")
        .setClass("mod-cta")
        .setButtonText("🎨 Open style settings")
        .onClick(() => {
          this.app.setting.open();
          this.app.setting.openTabById("obsidian-style-settings");
          this.app.workspace.trigger("parse-style-settings");
          setTimeout(() => {
            let floatsettingEI = this.app.setting.activeTab.containerEl.querySelector(".setting-item-heading[data-id='floating-toc-styles']")
            if (floatsettingEI) { floatsettingEI.addClass?.("float-cta"); }
            else {
              this.app.workspace.trigger("parse-style-settings");
              this.app.setting.activeTab.containerEl.querySelector(".setting-item-heading[data-id='floating-toc-styles']")?.addClass?.("float-cta");
            }
          }, 250);
        });
    } else {
      contentE1.createEl("br");
      contentE1.createEl("span", { text: "" }).createEl("a", {
        text: "Please install or enable the style-settings plugin",
        href: "obsidian://show-plugin?id=obsidian-style-settings",
      })
    }

    // 捐赠部分
    const cDonationDiv = containerEl.createEl("div", {
      cls: "cDonationSection",
    });

    const credit = createEl("p");
    const donateText = createEl("p");
    donateText.appendText(
      "If you like this Plugin and are considering donating to support continued development, use the button below!"
    );
    credit.setAttribute("style", "color: var(--text-muted)");
    cDonationDiv.appendChild(donateText);
    cDonationDiv.appendChild(credit);

    cDonationDiv.appendChild(
      createDonateButton("https://github.com/cumany#thank-you-very-much-for-your-support")
    );
  }
}

const createDonateButton = (link: string): HTMLElement => {
  const a = createEl("a");
  a.setAttribute("href", link);
  a.addClass("buymeacoffee-img");
  a.innerHTML = `<img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee &emoji=&slug=Cuman&button_colour=BD5FFF&font_colour=ffffff&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00" />`;
  return a;
};



