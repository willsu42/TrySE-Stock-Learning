import { Copy } from '../domain/types';
export const bi = (en: string, zh: string): Copy => ({ en, 'zh-TW': zh });
export interface Lesson {
  id: string;
  title: Copy;
  description: Copy;
  minutes: number;
  body: Copy;
  example: Copy;
  hint: Copy;
  practice: Copy;
  resources: string[];
  source: string;
}
export interface Question {
  id: string;
  lessonId: string;
  prompt: Copy;
  options: Copy[];
  answer: number;
  explanation: Copy;
  legacyId?: number;
}
export const lessons: Lesson[] = [
  {
    id: 'ownership',
    title: bi('A small piece of a company', '從一小份公司開始'),
    description: bi('What you own when you buy a share.', '買一股，你擁有的是什麼？'),
    minutes: 4,
    body: bi(
      'A share represents an ownership interest in a company. A stock exchange brings buyers and sellers together. The ticker identifies a listed security, but the exchange and share class matter too. Owning shares does not guarantee income or protect the amount you paid.',
      '股票代表對公司的部分所有權。證券交易所讓買賣雙方進行交易。股票代碼用來識別證券，但也需要確認交易所和股別。持有股票不保證有收入，也不保證本金。',
    ),
    example: bi(
      'If a fictional company has 1,000 equal shares and you own 10, your ownership is 1%. Your investment value still changes with the share price.',
      '假設公司有 1,000 股同類股票，你持有 10 股，便擁有其中的 1%。投資價值仍會隨股價變動。',
    ),
    hint: bi('Think ownership, not a savings deposit.', '把股票想成所有權，而不是存款。'),
    practice: bi(
      'Buy one practice share and find it in your holdings.',
      '在模擬中買進一股，再查看持股。',
    ),
    resources: ['sec-stocks', 'twse-basics'],
    source: 'Adapted from legacy lesson 1: 什麼是股票',
  },
  {
    id: 'risk',
    title: bi('Risk has more than one shape', '認識不同的風險'),
    description: bi('Diversification and your time horizon.', '分散投資與投資期間。'),
    minutes: 5,
    body: bi(
      'A company can disappoint even when its industry is growing. Spreading an investment across companies and industries reduces concentration in any one business, but does not eliminate market losses. Money needed soon has less time to recover from a decline.',
      '即使產業成長，個別公司的表現也可能不如預期。分散到不同公司和產業可以降低集中風險，但無法消除整體市場下跌的損失。近期需要用到的資金，也較沒有時間等待跌勢恢復。',
    ),
    example: bi(
      'Holding three chipmakers spreads company-specific risk, but all three may still react to the same semiconductor downturn.',
      '持有三家晶片公司可分散個別公司風險，但它們仍可能一起受到半導體景氣影響。',
    ),
    hint: bi(
      'Count the different risks, not just the ticker symbols.',
      '除了股票數量，也要看風險是否相似。',
    ),
    practice: bi(
      'Compare a technology stock with a financial or consumer company.',
      '比較科技股與金融或消費公司的產業。',
    ),
    resources: ['finra-risk', 'finra-diversification'],
    source: 'Adapted from legacy lesson 6: 股票風險',
  },
  {
    id: 'returns',
    title: bi('Where returns come from', '報酬從哪裡來'),
    description: bi('Price changes, dividends, and percentages.', '股價變動、股息與報酬率。'),
    minutes: 5,
    body: bi(
      'Your total return includes price changes and distributions, less costs. A dividend is a payment to eligible shareholders; it is not free extra value, and prices may adjust around the distribution. Percentage returns let you compare different investment sizes.',
      '總報酬包含股價變動與分配，並扣除成本。股息是給符合資格股東的分配，不是憑空增加的價值，股價也可能在分配時調整。報酬率可用來比較不同投入金額的成果。',
    ),
    example: bi(
      'Buy for $100, receive a $2 dividend, and sell for $105: the gain is $7, or 7%, before fees and taxes.',
      '以 100 元買進，收到 2 元股息，再以 105 元賣出：未計費用和稅的獲利是 7 元，報酬率 7%。',
    ),
    hint: bi(
      'Include both cash distributions and the price difference.',
      '記得把現金分配與價差一起計算。',
    ),
    practice: bi(
      'Advance a session and compare your cash with market value.',
      '前進一個交易日，比較現金與持股市值。',
    ),
    resources: ['sec-stocks', 'finra-stocks'],
    source: 'Adapted from legacy lessons 3 and 8: 股票紅利 / 股票獲利來源',
  },
  {
    id: 'orders',
    title: bi('Your first practice order', '第一筆模擬交易'),
    description: bi('Shares, order value, and available cash.', '股數、交易金額與可用現金。'),
    minutes: 4,
    body: bi(
      'Order value equals shares multiplied by execution price. This sandbox fills whole-share orders immediately at the displayed synthetic price with zero fees. Real markets have execution, liquidity, order-type, and settlement rules that this first build does not reproduce.',
      '交易金額等於股數乘以成交價。本練習以畫面上的合成價格立即成交整股訂單，不收費用。真實市場還有成交、流動性、訂單類型與交割規則，第一版未完整模擬。',
    ),
    example: bi(
      'With $1,000 cash, buying 3 shares at $120 uses $360 and leaves $640. A request for 9 shares must be rejected.',
      '有 1,000 元現金，以每股 120 元買進 3 股，支出 360 元，剩下 640 元。買進 9 股的請求應被拒絕。',
    ),
    hint: bi(
      'An order cannot spend more cash than your practice wallet holds.',
      '模擬訂單不能花超過帳戶內的現金。',
    ),
    practice: bi(
      'Try a valid order, then a quantity you cannot afford.',
      '先下一筆可負擔的訂單，再試試超過現金的數量。',
    ),
    resources: ['sec-order-types', 'twse-learning'],
    source: 'New simulator tutorial; references legacy lesson 9',
  },
  {
    id: 'portfolio',
    title: bi('Read your portfolio', '看懂你的投資組合'),
    description: bi('Cash, cost basis, and unrealized gains.', '現金、成本與未實現損益。'),
    minutes: 6,
    body: bi(
      'Equity equals cash plus the current value of your holdings. Book cost is the amount allocated to shares still held. Unrealized gain compares their current value with that cost. A sale turns part of the gain or loss into realized profit or loss. This app allocates cost using weighted average.',
      '帳戶總值等於現金加上持股目前市值。帳面成本是分配到剩餘持股的成本。未實現損益是目前市值與成本的差額；賣出後，相應部分成為已實現損益。本程式採加權平均成本。',
    ),
    example: bi(
      'Buy 2 shares at $100 and 2 at $120. Total cost is $440, average $110. Selling one at $130 realizes a $20 gain, before costs.',
      '先以 100 元買 2 股，再以 120 元買 2 股，總成本 440 元，平均每股 110 元。以 130 元賣 1 股，未計費用的已實現獲利為 20 元。',
    ),
    hint: bi(
      'A price change changes value; a trade changes cash.',
      '股價變動改變市值；交易才改變現金。',
    ),
    practice: bi(
      'Buy twice, sell part, and inspect the ledger.',
      '分兩次買進、賣出部分，再檢查交易紀錄。',
    ),
    resources: ['finra-basics', 'sec-products'],
    source: 'New accounting lesson; legacy question 7 adapted',
  },
  {
    id: 'markets',
    title: bi('Two markets, two currencies', '兩個市場、兩種貨幣'),
    description: bi('Explore Taiwan and US stocks.', '探索台股與美股。'),
    minutes: 4,
    body: bi(
      'A listing belongs to an exchange and is quoted in a currency. This app separates TWD and USD practice wallets. A language change does not exchange money. Our synthetic demo uses fictional weekday sessions; real historical replay will need the correct exchange holidays and corporate actions.',
      '股票在特定交易所掛牌，並以特定貨幣報價。本程式將新台幣與美元練習帳戶分開，切換語言不會兌換貨幣。目前合成資料使用虛構的平日交易日；真實歷史回放需要正確的休市日與公司行動。',
    ),
    example: bi(
      'NT$1,000 and US$1,000 cannot be added into a meaningful combined balance without an exchange rate.',
      '新台幣 1,000 元與美元 1,000 元，沒有匯率就不能直接相加成有意義的總值。',
    ),
    hint: bi('Look for TWD or USD beside every amount.', '查看每個金額旁的 TWD 或 USD。'),
    practice: bi(
      'Switch markets and check that each wallet keeps its own cash.',
      '切換市場，確認兩個帳戶保有各自的現金。',
    ),
    resources: ['twse-basics', 'sec-intro'],
    source: 'New cross-market lesson',
  },
  {
    id: 'indices',
    title: bi('A basket, not a crystal ball', '指數是一籃子股票'),
    description: bi('Understand indices and ETFs.', '了解指數與 ETF。'),
    minutes: 5,
    body: bi(
      'An index measures a selected basket using defined membership and weighting rules. An ETF is a fund whose shares trade on an exchange; many ETFs aim to track an index. Constituents change over time. Using today’s members to evaluate the past can overlook companies that left the basket.',
      '指數依成分與權重規則衡量一籃子證券。ETF 是在交易所交易的基金，許多 ETF 以追蹤指數為目標。成分股會隨時間改變；用今天的成分股評估過去，可能漏掉已被移除的公司。',
    ),
    example: bi(
      'In a two-stock basket weighted 75% and 25%, returns of +10% and −10% give a +5% weighted return for the period.',
      '兩檔股票權重為 75% 與 25%，報酬分別是 +10% 與 −10%，該期間的加權報酬為 +5%。',
    ),
    hint: bi('Multiply each return by its starting weight.', '將每檔報酬乘以期初權重後相加。'),
    practice: bi(
      'Compare your selected companies’ sectors before buying.',
      '買進前比較所選公司的產業。',
    ),
    resources: ['sec-etfs', 'finra-diversification'],
    source: 'Adapted from legacy lesson 4: 股票指數; question 7',
  },
  {
    id: 'research',
    title: bi('Ask better questions', '做研究，先問好問題'),
    description: bi('Earnings, valuation, and reliable sources.', '盈餘、估值與可靠來源。'),
    minutes: 5,
    body: bi(
      'A price is what the market currently pays; it is not a complete measure of business quality. The price-to-earnings ratio divides share price by earnings per share. It needs context and is difficult to interpret when earnings are negative or unusual. A low ratio alone does not make a stock a bargain.',
      '股價是市場目前願意支付的價格，不能完整代表企業品質。本益比等於每股價格除以每股盈餘，需要搭配背景判讀；盈餘為負或異常時尤其要小心。低本益比本身不代表便宜。',
    ),
    example: bi(
      'A $60 share with $3 earnings per share has a P/E of 20. That number alone cannot tell you its future return.',
      '每股 60 元、每股盈餘 3 元，本益比為 20 倍。光靠這個數字無法得知未來報酬。',
    ),
    hint: bi('Separate a calculation from a prediction.', '把計算結果與預測分開。'),
    practice: bi(
      'Open an official learning resource and save it for later.',
      '開啟官方學習資源並加入書籤。',
    ),
    resources: ['sec-research', 'finra-basics'],
    source: 'Adapted from legacy question 5; explanation corrected',
  },
  {
    id: 'forecast',
    title: bi('Can you beat a baseline?', '你的預測能勝過基準嗎？'),
    description: bi('Learn what a forecast can—and cannot—show.', '了解預測能說明什麼。'),
    minutes: 6,
    body: bi(
      'A forecast is an estimate made before an outcome is known. A fair test trains on the past and evaluates on later observations. A simple baseline predicts no price change. Compare errors over many cases: one successful guess does not prove a reliable method. Our lab uses synthetic data to test the experience, not investment performance.',
      '預測是在結果未知時做出的估計。公平測試應使用過去資料訓練，再用較晚資料評估。簡單基準是假設價格不變。需要比較多次誤差，一次猜中不能證明方法可靠。本實驗室以合成資料測試功能，不代表投資績效。',
    ),
    example: bi(
      'Predict $105 and observe $102: absolute error is $3. A $100 no-change forecast has error $2, so the baseline was closer.',
      '預測 105 元，結果 102 元，絕對誤差為 3 元。若不變基準是 100 元，誤差 2 元，則基準較接近結果。',
    ),
    hint: bi(
      'Keep the outcome hidden until the prediction is locked.',
      '在鎖定預測前，不能看到結果。',
    ),
    practice: bi(
      'Make a prediction, lock it, and reveal the result in the lab.',
      '到實驗室輸入預測、鎖定，再揭曉結果。',
    ),
    resources: ['sec-intro', 'finra-risk'],
    source: 'New forecast-literacy lesson',
  },
];
function question(
  id: string,
  lessonId: string,
  prompt: Copy,
  options: Copy[],
  answer: number,
  explanation: Copy,
  legacyId?: number,
): Question {
  return { id, lessonId, prompt, options, answer, explanation, legacyId };
}
export const questions: Question[] = [
  question(
    'ownership-1',
    'ownership',
    bi('What does owning a share represent?', '持有股票代表什麼？'),
    [
      bi('Partial ownership', '部分所有權'),
      bi('A guaranteed deposit', '保證的存款'),
      bi('A fixed future return', '固定的未來報酬'),
    ],
    0,
    bi(
      'A share represents an ownership interest, with both potential returns and risks.',
      '股票代表部分所有權，同時有潛在報酬與風險。',
    ),
  ),
  question(
    'risk-1',
    'risk',
    bi(
      'Which portfolio reduces concentration in one industry?',
      '哪個組合較能降低單一產業集中風險？',
    ),
    [
      bi('Three chipmakers', '三家晶片公司'),
      bi('Companies in different industries', '不同產業的公司'),
      bi('One popular stock', '一檔熱門股'),
    ],
    1,
    bi(
      'Different industries can reduce shared exposure, but market risk remains.',
      '不同產業有助減少共同風險，但市場風險仍存在。',
    ),
  ),
  question(
    'returns-1',
    'returns',
    bi(
      'Buy at $100, collect $2, sell at $105. Return before costs?',
      '100 元買進，領 2 元，105 元賣出。未計成本的報酬率？',
    ),
    [bi('5%', '5%'), bi('2%', '2%'), bi('7%', '7%')],
    2,
    bi('(105 − 100 + 2) ÷ 100 = 7%.', '(105 − 100 + 2) ÷ 100 = 7%。'),
  ),
  question(
    'orders-1',
    'orders',
    bi('How much do 3 shares at $120 cost before fees?', '每股 120 元，3 股未計費用需多少？'),
    [bi('$360', '360 元'), bi('$120', '120 元'), bi('$40', '40 元')],
    0,
    bi('Multiply the per-share price by the number of shares.', '每股價格乘以股數。'),
  ),
  question(
    'portfolio-1',
    'portfolio',
    bi(
      'A holding’s price rises, with no trade or dividend. What changes?',
      '沒有交易或股息，持股價格上升。什麼改變？',
    ),
    [
      bi('Cash increases', '現金增加'),
      bi('Market value increases; cash stays the same', '市值增加，現金不變'),
      bi('The number of shares increases', '股數增加'),
    ],
    1,
    bi(
      'A price movement changes unrealized value, not your cash balance.',
      '價格變動影響未實現價值，不改變現金。',
    ),
  ),
  question(
    'markets-1',
    'markets',
    bi(
      'Switching the app language to English does what to TWD cash?',
      '把語言切成英文，新台幣現金會如何？',
    ),
    [
      bi('Converts it to USD', '轉成美元'),
      bi('Resets the balance', '重設餘額'),
      bi('Leaves currency and balance unchanged', '貨幣與餘額不變'),
    ],
    2,
    bi(
      'Language is a display preference, not a currency exchange.',
      '語言是顯示偏好，不是貨幣兌換。',
    ),
  ),
  question(
    'legacy-7',
    'indices',
    bi(
      'A portfolio’s return is based on which average of its holdings’ returns?',
      '投資組合報酬率應以個別報酬的哪種平均計算？',
    ),
    [
      bi('Always an equal average', '一律等權平均'),
      bi('A weighted average', '加權平均'),
      bi('The highest return', '最高報酬'),
    ],
    1,
    bi(
      'Use the investments’ starting weights for the period, with appropriate treatment of cash flows.',
      '使用該期間的期初權重，並適當處理資金流入流出。',
    ),
    7,
  ),
  question(
    'legacy-5',
    'research',
    bi('How is the price-to-earnings ratio calculated?', '本益比如何計算？'),
    [
      bi('Share price ÷ earnings per share', '每股價格 ÷ 每股盈餘'),
      bi('Profit ÷ cash', '獲利 ÷ 現金'),
      bi('Shares × dividends', '股數 × 股息'),
    ],
    0,
    bi(
      'P/E = price per share / earnings per share. It does not guarantee a payback period.',
      '本益比 = 每股價格 / 每股盈餘，並不保證回本年限。',
    ),
    5,
  ),
  question(
    'forecast-1',
    'forecast',
    bi('Which data may train a model predicting tomorrow?', '預測明天的模型可以使用哪些資料訓練？'),
    [
      bi('Tomorrow’s closing price', '明天的收盤價'),
      bi('Only information available by the cutoff', '截止時間前已知的資料'),
      bi('Any later outcomes', '任何之後的結果'),
    ],
    1,
    bi(
      'Future observations must stay out of training and preprocessing.',
      '未來觀測不能進入訓練或前處理。',
    ),
  ),
];
export interface Resource {
  id: string;
  title: Copy;
  description: Copy;
  publisher: string;
  language: 'en' | 'zh-TW';
  topic: 'basics' | 'risk' | 'trading';
  url: string;
  format: Copy;
  reviewed: string;
}
const resource = (
  id: string,
  title: Copy,
  description: Copy,
  publisher: string,
  language: 'en' | 'zh-TW',
  topic: Resource['topic'],
  url: string,
): Resource => ({
  id,
  title,
  description,
  publisher,
  language,
  topic,
  url,
  format: bi('Article / learning hub', '文章／學習網站'),
  reviewed: '2026-09-18',
});
export const resources: Resource[] = [
  resource(
    'twse-basics',
    bi('TWSE investor education', 'TWSE 投資人知識網'),
    bi('Explore Taiwan market concepts and investor Q&A.', '探索台灣市場觀念與投資問答。'),
    'TWSE',
    'zh-TW',
    'basics',
    'https://investoredu.twse.com.tw/Pages/TWSE.aspx',
  ),
  resource(
    'twse-learning',
    bi('Learn with TWSE', 'TWSE 宅在家學習網'),
    bi('Find illustrated guides, videos, and learning activities.', '閱讀圖解、影片與學習活動。'),
    'TWSE',
    'zh-TW',
    'trading',
    'https://shl.twse.com.tw/',
  ),
  resource(
    'sec-intro',
    bi('Introduction to investing', '投資入門'),
    bi('An official starting point for investing vocabulary.', '從官方資料開始認識投資詞彙。'),
    'SEC Investor.gov',
    'en',
    'basics',
    'https://www.investor.gov/introduction-investing',
  ),
  resource(
    'sec-stocks',
    bi('What are stocks?', '什麼是股票？'),
    bi('Understand stock ownership and its potential risks.', '了解股票所有權與潛在風險。'),
    'SEC Investor.gov',
    'en',
    'basics',
    'https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks',
  ),
  resource(
    'sec-products',
    bi('Investment products', '投資商品'),
    bi('Compare the purposes and risks of investment products.', '比較不同投資商品的用途與風險。'),
    'SEC Investor.gov',
    'en',
    'basics',
    'https://www.investor.gov/introduction-investing/investing-basics/investment-products',
  ),
  resource(
    'finra-basics',
    bi('Build your investing foundations', '建立投資基礎'),
    bi('Short introductions and courses for new investors.', '適合新手的簡介與課程。'),
    'FINRA',
    'en',
    'basics',
    'https://www.finra.org/investors/investing/investing-basics',
  ),
  resource(
    'finra-risk',
    bi('Understand investment risk', '認識投資風險'),
    bi('Learn about different sources of risk.', '認識不同的風險來源。'),
    'FINRA',
    'en',
    'risk',
    'https://www.finra.org/investors/investing/investing-basics/risk',
  ),
  resource(
    'finra-diversification',
    bi('Diversification and allocation', '分散投資與資產配置'),
    bi('Learn how investment mix affects exposure.', '了解資產組合如何影響風險。'),
    'FINRA',
    'en',
    'risk',
    'https://www.finra.org/investors/investing/investing-basics/asset-allocation-diversification',
  ),
  resource(
    'finra-stocks',
    bi('A closer look at stocks', '進一步認識股票'),
    bi('Read about stock investing and trading concepts.', '閱讀股票投資與交易觀念。'),
    'FINRA',
    'en',
    'trading',
    'https://www.finra.org/investors/investing/investment-products/stocks',
  ),
  resource(
    'sec-order-types',
    bi('Investing on your own', '自主投資入門'),
    bi('Explore ways to invest and continue learning.', '探索投資方式與延伸學習。'),
    'SEC Investor.gov',
    'en',
    'trading',
    'https://www.investor.gov/introduction-investing/getting-started/investing-your-own',
  ),
  resource(
    'sec-etfs',
    bi('Explore investment options', '探索投資選項'),
    bi('Use the official roadmap to compare investment choices.', '透過官方學習路線比較投資選項。'),
    'SEC Investor.gov',
    'en',
    'basics',
    'https://www.investor.gov/introduction-investing/investing-basics/save-and-invest',
  ),
  resource(
    'sec-research',
    bi('Tips for new investors', '新手投資學習指南'),
    bi(
      'Begin with objectives, time horizon, and understanding costs.',
      '從目標、投資期間與成本開始。',
    ),
    'FINRA',
    'en',
    'risk',
    'https://www.finra.org/investors/insights/tips-new-investors',
  ),
];
