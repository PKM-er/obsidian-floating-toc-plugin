import type FloatingToc from "src/main";
import { MarkdownView, HeadingCache } from "obsidian";
import { t } from 'src/translations/helper';

// 拼音映射表（简化版，可以根据需要扩展）
const PINYIN_MAP: { [key: string]: string[] } = {
  'a': ['a', 'ā', 'á', 'ǎ', 'à'],
  'ai': ['ai', 'āi', 'ái', 'ǎi', 'ài'],
  'an': ['an', 'ān', 'án', 'ǎn', 'àn'],
  'ang': ['ang', 'āng', 'áng', 'ǎng', 'àng'],
  'ao': ['ao', 'āo', 'áo', 'ǎo', 'ào'],
  'b': ['b', 'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu'],
  'c': ['c', 'ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo'],
  'd': ['d', 'da', 'dai', 'dan', 'dang', 'dao', 'de', 'dei', 'den', 'deng', 'di', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo'],
  'e': ['e', 'ē', 'é', 'ě', 'è'],
  'ei': ['ei', 'ēi', 'éi', 'ěi', 'èi'],
  'en': ['en', 'ēn', 'én', 'ěn', 'èn'],
  'eng': ['eng', 'ēng', 'éng', 'ěng', 'èng'],
  'er': ['er', 'ēr', 'ér', 'ěr', 'èr'],
  'f': ['f', 'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu'],
  'g': ['g', 'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo'],
  'h': ['h', 'ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo'],
  'i': ['i', 'ī', 'í', 'ǐ', 'ì'],
  'j': ['j', 'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun'],
  'k': ['k', 'ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'kei', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo'],
  'l': ['l', 'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'long', 'lou', 'lu', 'lü', 'luan', 'lüe', 'lun', 'luo'],
  'm': ['m', 'ma', 'mai', 'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'miu', 'mo', 'mou', 'mu'],
  'n': ['n', 'na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nou', 'nu', 'nü', 'nuan', 'nüe', 'nuo'],
  'o': ['o', 'ō', 'ó', 'ǒ', 'ò'],
  'p': ['p', 'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pou', 'pu'],
  'q': ['q', 'qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun'],
  'r': ['r', 'ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'ruan', 'rui', 'run', 'ruo'],
  's': ['s', 'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shen', 'sheng', 'shi', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo'],
  't': ['t', 'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo'],
  'u': ['u', 'ū', 'ú', 'ǔ', 'ù'],
  'v': ['v'],
  'w': ['w', 'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu'],
  'x': ['x', 'xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun'],
  'y': ['y', 'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yong', 'you', 'yu', 'yuan', 'yue', 'yun'],
  'z': ['z', 'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhen', 'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo']
};

// 简化的拼音转换函数
function toPinyin(text: string): string {
  // 这里使用简化的拼音转换，实际项目中可以使用更完整的拼音库
  return text.toLowerCase();
}

// 模糊搜索函数
function fuzzySearch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // 直接匹配
  if (textLower.includes(queryLower)) {
    return true;
  }
  
  // 拼音匹配
  const textPinyin = toPinyin(text);
  if (textPinyin.includes(queryLower)) {
    return true;
  }
  
  // 首字母匹配
  const queryChars = queryLower.split('');
  const textChars = textLower.split('');
  
  let queryIndex = 0;
  for (let i = 0; i < textChars.length && queryIndex < queryChars.length; i++) {
    if (textChars[i] === queryChars[queryIndex]) {
      queryIndex++;
    }
  }
  
  return queryIndex === queryChars.length;
}

// 搜索状态管理
interface SearchState {
  isActive: boolean;
  query: string;
  results: HTMLElement[];
  currentIndex: number;
  searchTimeout: number | null;
}

export class FloatingTocSearch {
  private plugin: FloatingToc;
  private state: SearchState;
  private searchInput: HTMLInputElement | null = null;
  private searchContainer: HTMLDivElement | null = null;

  constructor(plugin: FloatingToc) {
    this.plugin = plugin;
    this.state = {
      isActive: false,
      query: '',
      results: [],
      currentIndex: -1,
      searchTimeout: null
    };
  }

  // 初始化搜索功能
  initSearch(floatTocDiv: HTMLElement) {
    // 检查是否启用了搜索功能
   
    // 创建搜索输入框
    this.createSearchInput(floatTocDiv);
    
    // 监听键盘事件
    this.setupKeyboardListeners(floatTocDiv);
  }

  // 创建搜索输入框
  private createSearchInput(floatTocDiv: HTMLElement) {
    // 创建搜索容器，直接添加到浮动目录div中
    this.searchContainer = floatTocDiv.createEl('div', {
      cls: 'floating-toc-search-container'
    });
    
    // 创建搜索输入框
    this.searchInput = this.searchContainer.createEl('input', {
      type: 'text',
      placeholder: t('Search title... '),
      cls: 'floating-toc-search-input'
    });
    
    // 创建关闭按钮
    const closeButton = this.searchContainer.createEl('button', {
      cls: 'floating-toc-search-close'
    });
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', t('Close search'));
    
    // 添加关闭按钮点击事件
    closeButton.addEventListener('click', () => {
      this.hideSearch();
    });
    
    // 初始时隐藏搜索框
    this.searchContainer.style.display = 'none';
    
    // 监听输入事件
    this.searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleSearchInput(target.value);
    });
    
    // 监听回车键
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.selectCurrentResult();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideSearch();
      }
    });
  }

  // 设置键盘监听器
  private setupKeyboardListeners(floatTocDiv: HTMLElement) {
    // 监听浮动目录的键盘事件
    
    
    // 监听全局键盘事件用于快捷键和方向键导航
    document.addEventListener('keydown', (e) => {
      // 检查快捷键 Ctrl+Shift+F
 
      
      // 如果搜索未激活，不处理其他键盘事件
      if (!this.state.isActive) return;
      
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          this.navigateResults(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateResults(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigateResults(1);
          break;
        case 'Enter':
          e.preventDefault();
          this.selectCurrentResult();
          break;
        case 'Escape':
          e.preventDefault();
          this.hideSearch();
          break;
      }
    });
  }

  // 开始搜索
  private startSearch(initialChar: string) {
    this.state.isActive = true;
    this.state.query = initialChar;
    this.state.currentIndex = -1;
    
    if (this.searchInput) {
      this.searchInput.value = initialChar;
      this.searchInput.style.display = 'block';
      this.searchInput.focus();
      this.searchInput.select();
    }
    
    if (this.searchContainer) {
      this.searchContainer.style.display = 'flex';
    }
    
    this.performSearch();
  }

  // 从按钮启动搜索
// 修改 startSearchFromButton 方法
public startSearchFromButton() {
  this.state.isActive = true;
  this.state.query = '';
  this.state.currentIndex = -1;
  
  if (this.searchContainer) {
    this.searchContainer.style.display = 'flex';
  }
  
  if (this.searchInput) {
    this.searchInput.value = '';
    this.searchInput.style.display = 'block';
    
    // 使用setTimeout确保DOM更新后再设置焦点
    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 10);
  }
  
  // 触发pin
  const floatTocDiv = document.querySelector('.floating-toc-div') as HTMLElement;
  if (floatTocDiv) {
    if (floatTocDiv.classList.contains("pin")) {
      // 已经包含pin类，只需添加search类
      floatTocDiv.addClass("searchonly");
    } else {
      // 不包含pin类，同时添加pin和search类
      floatTocDiv.addClass("pin");
      floatTocDiv.addClass("search");
    }
}
  
  this.performSearch();
}

  // 处理搜索输入
  private handleSearchInput(query: string) {
    this.state.query = query;
    
    // 清除之前的超时
    if (this.state.searchTimeout) {
      clearTimeout(this.state.searchTimeout);
    }
    
    // 设置防抖
    this.state.searchTimeout = window.setTimeout(() => {
      this.performSearch();
    }, 100);
  }

  // 执行搜索
  private performSearch() {
    const floatTocDiv = document.querySelector('.floating-toc-div');
    if (!floatTocDiv) return;
    
    const headingItems = floatTocDiv.querySelectorAll('.heading-list-item') as NodeListOf<HTMLElement>;
    this.state.results = [];
    
    // 清除之前的高亮和边框样式
    headingItems.forEach(item => {
      item.classList.remove('search-highlight', 'search-current');
 
    });
    
    if (!this.state.query.trim()) {
      this.state.currentIndex = -1;
      this.updateResultCount(0);
      return;
    }
    
    // 搜索匹配的标题
    headingItems.forEach(item => {
      const textElement = item.querySelector('.text');
      if (textElement) {
        const text = textElement.textContent || '';
        if (fuzzySearch(this.state.query, text)) {
          this.state.results.push(item);
          item.classList.add('search-highlight');
        }
      }
    });
    
    // 更新结果计数
    this.updateResultCount(this.state.results.length);
    
    // 设置当前选中项
    if (this.state.results.length > 0) {
      this.state.currentIndex = 0;
      const firstItem = this.state.results[0];
      firstItem.classList.add('search-current');
      
  
      
      this.scrollToResult(firstItem);
    }
  }

  // 更新结果计数显示
  private updateResultCount(count: number) {
    if (this.searchContainer) {
      this.searchContainer.setAttribute('data-result-count', `${count} results`);
    }
  }

  // 导航搜索结果
  private navigateResults(direction: number) {
    if (this.state.results.length === 0) return;
    
    // 移除当前高亮
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.results.length) {
      this.state.results[this.state.currentIndex].classList.remove('search-current');
    }
    
    // 计算新的索引
    this.state.currentIndex += direction;
    if (this.state.currentIndex < 0) {
      this.state.currentIndex = this.state.results.length - 1;
    } else if (this.state.currentIndex >= this.state.results.length) {
      this.state.currentIndex = 0;
    }
    
    // 添加新的高亮和边框提示
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.results.length) {
      const currentItem = this.state.results[this.state.currentIndex];
      currentItem.classList.add('search-current');
      
  
    
      
      this.scrollToResult(currentItem);
    }
  }

  // 滚动到搜索结果
  private scrollToResult(resultElement: HTMLElement) {
    const floatTocDiv = document.querySelector('.floating-toc-div');
    if (!floatTocDiv) return;
    
    const tocContainer = floatTocDiv.querySelector('.floating-toc') as HTMLElement;
    if (!tocContainer) return;
    
    // 获取容器和结果元素的尺寸信息
    const resultTop = resultElement.offsetTop;
    const resultHeight = resultElement.offsetHeight;
    const containerHeight = tocContainer.clientHeight;
    
    // 计算将结果元素放置在容器中央所需的滚动位置
    const scrollToMiddle = resultTop - (containerHeight / 2 - resultHeight / 2);
    
    // 使用平滑滚动效果
    tocContainer.scrollTo({
      top: Math.max(0, scrollToMiddle),
      behavior: 'smooth'
    });
  }

  // 选择当前结果
  private selectCurrentResult() {
    if (this.state.currentIndex >= 0 && this.state.currentIndex < this.state.results.length) {
      const selectedItem = this.state.results[this.state.currentIndex];
      const textElement = selectedItem.querySelector('.text') as HTMLElement;
      
      if (textElement) {
        // 触发点击事件
        textElement.click();
      }
    }
    
    this.hideSearch();
  }

  // 隐藏搜索
  private hideSearch() {
    this.state.isActive = false;
    this.state.query = '';
    this.state.currentIndex = -1;
    
    // 清除搜索结果高亮
    const floatTocDiv = document.querySelector('.floating-toc-div');
    if (floatTocDiv) {
      const headingItems = floatTocDiv.querySelectorAll('.heading-list-item');
      headingItems.forEach(item => {
        item.classList.remove('search-highlight', 'search-current');
      });
      if (floatTocDiv.classList.contains("searchonly")) 
        floatTocDiv.removeClass("searchonly");
      else
      {
        if (floatTocDiv.classList.contains("pin") && floatTocDiv.classList.contains("search")) 
          // 元素同时包含pin和search类时执行的代码
          floatTocDiv.removeClass("pin");
          floatTocDiv.removeClass("search");
      }
        
      
    }
    
    // 隐藏搜索容器
    if (this.searchContainer) {
      this.searchContainer.style.display = 'none';
    }
    
 
    
    // 清除超时
    if (this.state.searchTimeout) {
      clearTimeout(this.state.searchTimeout);
      this.state.searchTimeout = null;
    }
  }

  // 检查搜索是否激活
  isSearchActive(): boolean {
    return this.state.isActive;
  }

  // 获取当前搜索状态
  getSearchState(): SearchState {
    return { ...this.state };
  }
} 