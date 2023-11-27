import type FloatingToc from "src/main";
import { App, Setting, PluginSettingTab, ButtonComponent } from "obsidian";
import { POSITION_STYLES } from "src/settings/settingsData";
import { selfDestruct } from "src/main";
import { creatToc } from "src/components/floatingtocUI"
import { t } from 'src/translations/helper';



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
    containerEl.createEl("h1", { text: "Obsidian Floating TOC " });
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "Author: Cuman ✨",
      href: "https://github.com/cumany",
    })
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "Readme:中文",
      href: "https://github.com/cumany/obsidian-floating-toc-plugin/blob/master/README-zh_cn.md",
    })
    containerEl.createEl("span", { text: "" }).createEl("a", {
      text: "|English  ",
      href: "https://github.com/cumany/obsidian-floating-toc-plugin/blob/master/README.md",
    });

    let tipsE1 = containerEl.createEl("div");
    tipsE1.addClass('callout');
    tipsE1.setAttribute("data-callout", "info");
    let tips_titleE1 = tipsE1.createEl("div", { text: "🔑TIPS:" })
    tips_titleE1.addClass("callout-title")
    tips_titleE1.createEl("br");
    let tips_contentE1 = tipsE1.createEl("div",{
      text: "ctrl + click on the floating toc to collapse/expand the header."
    })
    tips_contentE1.addClass("callout-content");
 
    containerEl.createEl("h2", { text: t("Plugin Settings") });
    let posE1 = new Setting(containerEl)
    posE1.setName(t('Floating TOC position')
    )
    if (this.plugin.settings.positionStyle == "both") {
      posE1.setDesc(
        t("When the panel is split left and right, the right side of the layout is aligned right and the left side of the panel is aligned left.")
      )
    } else if (this.plugin.settings.positionStyle == "right") {
      posE1.setDesc(
        t("Floating TOC position, on the right side of the notes")
      )
    } else
      posE1.setDesc(t('Floating TOC position, default on the left side of the notes'));
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
      new Setting(containerEl)
        .setName(t('Left alignment of TOC text')
        )
        .setDesc(
          t("whether the text in TOC is left aligned")
        )
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

    new Setting(containerEl)
      .setName("Default Expansion Level")
      .setDesc("Set the default expansion level of headings for newly opened notes")
      .addDropdown(dropdown => {
        dropdown.addOptions({
          '1': '1',
          '2': '2',
          '3': '3',
          '4': '4',
          '5': '5'
        });
        dropdown.setValue(this.plugin.settings.defaultExpansionLevel.toString())
          .onChange((value) => {
            this.plugin.settings.defaultExpansionLevel = parseInt(value);
            this.plugin.saveSettings();
            setTimeout(() => {
              dispatchEvent(new Event("refresh-toc"));
            }, 100);
          });
      });

    new Setting(containerEl)
      .setName(t('Mobile enabled or not')
      )
      .setDesc(
        t("Whether to enable the plugin for the mobile client, the default is enabled.")
      )
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isLoadOnMobile)
        .onChange((value) => {
          this.plugin.settings.isLoadOnMobile = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));

    new Setting(containerEl)
      .setName(t('Ignore top-level headers')
      )
      .setDesc(
        t("Select whether to ignore the top-level headings. When turned on, the top-level headings in the current note are not displayed in the floating TOC.")
      )
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.ignoreTopHeader)
        .onChange((value) => {
          this.plugin.settings.ignoreTopHeader = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));
    new Setting(containerEl)
      .setName(t('Default Pin')
      )
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isDefaultPin)
        .onChange((value) => {
          this.plugin.settings.isDefaultPin = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));
    new Setting(containerEl)
      .setName(t('Enable Tooltip')
      )
      .addToggle(toggle => toggle.setValue(this.plugin.settings?.isTooltip)
        .onChange((value) => {
          this.plugin.settings.isTooltip = value;
          this.plugin.saveSettings();
          setTimeout(() => {
            dispatchEvent(new Event("refresh-toc"));
          }, 100);
        }));
    containerEl.createEl("h2", { text: t("Plugin Style Settings") });
    let styleE1 = containerEl.createEl("div");
    styleE1.addClass('callout');
    styleE1.setAttribute("data-callout", "warning");
    let titleE1 = styleE1.createEl("div", { text: "🔔 Notice: Please click the button again,If the floating-toc option is not found in the style settings" })
    titleE1.addClass("callout-title")
    let contentE1 = styleE1.createEl("div")
    contentE1.addClass("callout-content");
    const isEnabled = app.plugins.enabledPlugins.has("obsidian-style-settings");
    if (isEnabled) {
      contentE1.createEl("br");
      let button = new ButtonComponent(contentE1);
      button
        .setIcon("palette")
        .setClass("mod-cta")
        .setButtonText("🎨 Open style settings")
        .onClick(() => {
          app.setting.open();
          app.setting.openTabById("obsidian-style-settings");
          app.workspace.trigger("parse-style-settings");
          setTimeout(() => {
            let floatsettingEI = app.setting.activeTab.containerEl.querySelector(".setting-item-heading[data-id='floating-toc-styles']")
            if (floatsettingEI) { floatsettingEI.addClass?.("float-cta"); }
            else {
              app.workspace.trigger("parse-style-settings");
              app.setting.activeTab.containerEl.querySelector(".setting-item-heading[data-id='floating-toc-styles']")?.addClass?.("float-cta");
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



