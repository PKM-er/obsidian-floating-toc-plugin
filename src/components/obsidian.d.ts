import "obsidian";

declare global {
  interface WindowEventMap {
    "refresh-toc": Event;
  }
}

 



declare module "obsidian" {
  export interface App {
    foldManager: FoldManager
    plugins: Plugins
    commands: Commands
    setting: SettingsManager
}

  interface SettingsManager {
    activeTab: SettingTab | null;
    openTabById(id: string): SettingTab | null;
    openTab(tab: SettingTab): void;
    open(): void;
    close(): void;
    onOpen(): void;
    onClose(): void;
    settingTabs: SettingTab[];
    pluginTabs: SettingTab[];
    addSettingTab(): void;
    removeSettingTab(): void;
    containerEl: HTMLDivElement;
}

interface Plugins {
  manifests: Record<string, PluginManifest>;
  plugins: Record<string, Plugin>;
  enabledPlugins:any;
  enablePlugin(pluginId: string): Promise<boolean>;
  disblePlugin(pluginId: string): Promise<void>;
}

interface Commands {
  commands: Record<string, Command>;
  addCommand(cmd: Command): void;
  removeCommand(cmd: Command): void;
}




  interface MarkdownView {
    onMarkdownFold(): void;
  }

  interface MarkdownSubView {
    applyFoldInfo(foldInfo: FoldInfo): void;
    getFoldInfo(): FoldInfo | null;
  }

  // These internal methods exist on both concrete subviews as well.
  interface MarkdownEditView extends MarkdownSubView {}
  interface MarkdownPreviewView extends MarkdownSubView {}

  interface Editor {
    cm: CodeMirror.Editor;
  }

  interface EditorSuggestManager {
    suggests: EditorSuggest<any>[];
  }


  interface FoldPosition {
    from: number;
    to: number;
  }

  interface FoldInfo {
    folds: FoldPosition[];
    lines: number;
  }

  export interface FoldManager {
    load(file: TFile): Promise<FoldInfo>;
    save(file: TFile, foldInfo: FoldInfo): Promise<void>;
  }



}

