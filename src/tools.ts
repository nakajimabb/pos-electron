export const MAIL_DOMAIN = '@ebondregister.com';

// カタカナをひらがなに変換
export const kanaToHira = (str: string) => {
  return str.replace(/[\u30a1-\u30f6]/g, function (match) {
    var chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

// ひらがなをカタカナに変換する
export const hiraToKana = (str: string) => {
  return str.replace(/[\u3041-\u3096]/g, function (match) {
    var chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
};

// 半角変換
export const toAscii = (str: string) => {
  const halfStr = str.replace(/[！-～]/g, (s) => {
    // 文字コードをシフト
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });

  // 文字コードシフトで対応できない文字の変換
  return halfStr
    .replace(/”/g, '"')
    .replace(/’/g, "'")
    .replace(/‘/g, '`')
    .replace(/￥/g, '\\')
    .replace(/　/g, ' ')
    .replace(/〜/g, '~')
    .replace(/[－−]/g, '-');
};

export const toHankana = (str: string) => {
  const kanaMap = new Map<string, string>([
    ['ガ', 'ｶﾞ'],
    ['ギ', 'ｷﾞ'],
    ['グ', 'ｸﾞ'],
    ['ゲ', 'ｹﾞ'],
    ['ゴ', 'ｺﾞ'],
    ['ザ', 'ｻﾞ'],
    ['ジ', 'ｼﾞ'],
    ['ズ', 'ｽﾞ'],
    ['ゼ', 'ｾﾞ'],
    ['ゾ', 'ｿﾞ'],
    ['ダ', 'ﾀﾞ'],
    ['ヂ', 'ﾁﾞ'],
    ['ヅ', 'ﾂﾞ'],
    ['デ', 'ﾃﾞ'],
    ['ド', 'ﾄﾞ'],
    ['バ', 'ﾊﾞ'],
    ['ビ', 'ﾋﾞ'],
    ['ブ', 'ﾌﾞ'],
    ['ベ', 'ﾍﾞ'],
    ['ボ', 'ﾎﾞ'],
    ['パ', 'ﾊﾟ'],
    ['ピ', 'ﾋﾟ'],
    ['プ', 'ﾌﾟ'],
    ['ペ', 'ﾍﾟ'],
    ['ポ', 'ﾎﾟ'],
    ['ヴ', 'ｳﾞ'],
    ['ヷ', 'ﾜﾞ'],
    ['ヺ', 'ｦﾞ'],
    ['ア', 'ｱ'],
    ['イ', 'ｲ'],
    ['ウ', 'ｳ'],
    ['エ', 'ｴ'],
    ['オ', 'ｵ'],
    ['カ', 'ｶ'],
    ['キ', 'ｷ'],
    ['ク', 'ｸ'],
    ['ケ', 'ｹ'],
    ['コ', 'ｺ'],
    ['サ', 'ｻ'],
    ['シ', 'ｼ'],
    ['ス', 'ｽ'],
    ['セ', 'ｾ'],
    ['ソ', 'ｿ'],
    ['タ', 'ﾀ'],
    ['チ', 'ﾁ'],
    ['ツ', 'ﾂ'],
    ['テ', 'ﾃ'],
    ['ト', 'ﾄ'],
    ['ナ', 'ﾅ'],
    ['ニ', 'ﾆ'],
    ['ヌ', 'ﾇ'],
    ['ネ', 'ﾈ'],
    ['ノ', 'ﾉ'],
    ['ハ', 'ﾊ'],
    ['ヒ', 'ﾋ'],
    ['フ', 'ﾌ'],
    ['ヘ', 'ﾍ'],
    ['ホ', 'ﾎ'],
    ['マ', 'ﾏ'],
    ['ミ', 'ﾐ'],
    ['ム', 'ﾑ'],
    ['メ', 'ﾒ'],
    ['モ', 'ﾓ'],
    ['ヤ', 'ﾔ'],
    ['ユ', 'ﾕ'],
    ['ヨ', 'ﾖ'],
    ['ラ', 'ﾗ'],
    ['リ', 'ﾘ'],
    ['ル', 'ﾙ'],
    ['レ', 'ﾚ'],
    ['ロ', 'ﾛ'],
    ['ワ', 'ﾜ'],
    ['ヲ', 'ｦ'],
    ['ン', 'ﾝ'],
    ['ァ', 'ｧ'],
    ['ィ', 'ｨ'],
    ['ゥ', 'ｩ'],
    ['ェ', 'ｪ'],
    ['ォ', 'ｫ'],
    ['ッ', 'ｯ'],
    ['ャ', 'ｬ'],
    ['ュ', 'ｭ'],
    ['ョ', 'ｮ'],
    ['。', '｡'],
    ['、', '､'],
    ['ー', 'ｰ'],
    ['「', '｢'],
    ['」', '｣'],
    ['・', '･'],
  ]);

  const reg = new RegExp('(' + Array.from(kanaMap.keys()).join('|') + ')', 'g');
  return str
    .replace(reg, (match) => kanaMap.get(match))
    .replace(/゛/g, 'ﾞ')
    .replace(/゜/g, 'ﾟ');
};

// 数値変換
export const toNumber = (value: any) => {
  const str = String(value);
  const ret = toAscii(str).replace(/,/g, '');
  const num = ret ? parseInt(ret) : 0;
  return isNaN(num) ? 0 : num;
};

// val: データ[1〜10桁]
// classCode: 種別[2桁]
// 戻り値: バーコード[13桁]
export const genBarcode = (val: string, classCode: string) => {
  if (val.match(/^\d{1,10}$/) && classCode.match(/^\d{2}$/)) {
    const data = val.padStart(10, '0') + classCode; // 10桁
    const digit = genCheckDigit(data);
    return data + digit;
  }
};

// barcode: バーコード[13桁]
// classCode: 種別[2桁]
export const getBarcodeValue = (barcode: string, classCode: string) => {
  if (barcode.match(/^\d{13}$/) && barcode.slice(10, 12) === classCode && checkDigit(barcode)) {
    return barcode.slice(0, 10);
  }
};

// チェックデジット生成(str => 12桁dijit桁なし)
export const genCheckDigit = (str: string) => {
  if (str.match(/^\d{12}$/)) {
    const nums = Array.from(str)
      .reverse()
      .map((i) => +i); // 逆順にして、数値の配列に変換
    const sum_evens = nums.filter((_, i) => i % 2 === 0).reduce((sum, i) => sum + i); // 偶数の桁の数字の和
    const sum_odds = nums.filter((_, i) => i % 2 === 1).reduce((sum, i) => sum + i); // CD(0桁)を除く奇数の桁の数字の和
    const sum = 3 * sum_evens + sum_odds;
    const digit = (10 - (sum % 10)) % 10;
    return String(digit);
  }
};

// JANコードのチェックデジット(str => 8 or 13桁)
export const checkDigit = (str: string) => {
  if (str.match(/^\d{8}$|^\d{13}$/)) {
    const jan = str.padStart(13, '0'); // 13桁
    return genCheckDigit(jan.slice(0, 12)) === jan.slice(-1);
  }
};

export const nameWithCode = (obj: { code: string; name: string }) => {
  const strs: string[] = [];
  if (obj['code']) strs.push(obj['code']);
  if (obj['name']) strs.push(obj['name']);
  return strs.join(' ');
};

export const userCodeFromEmail = (email: string) => {
  const reg = new RegExp(`(.+)${MAIL_DOMAIN}`);
  const m = email.match(reg);
  if (m && m[1]) {
    return m[1];
  } else {
    return null;
  }
};

//日付から文字列に変換する関数
export const toDateString = (date: Date, format: string) => {
  let result = format;
  result = result.replace(/YYYY/g, String(date.getFullYear()).padStart(4, '0'));
  result = result.replace(/YY/g, String(date.getFullYear() - 2000).padStart(2, '0'));
  result = result.replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'));
  result = result.replace(/DD/g, String(date.getDate()).padStart(2, '0'));
  result = result.replace(/hh/g, String(date.getHours()).padStart(2, '0'));
  result = result.replace(/mm/g, String(date.getMinutes()).padStart(2, '0'));
  result = result.replace(/ss/g, String(date.getSeconds()).padStart(2, '0'));
  return result;
};

export const PATIENT_DIVISION = '1';
export const CONTAINER_DIVISION = '3';
export const OTC_DIVISION = '5';
export const OTC_REDUCED_DIVISION = '6';
export const HOME_TREATMENT_DIVISION = '7';
export const OTC_CODE = '9014';
export const OTC_REDUCED_CODE = '9016';

export const Divisions: { [code: string]: string } = {
  '1': '患者負担金',
  '2': '小分け',
  '3': '容器',
  '4': '負担金調整',
  '5': 'OTC（10%）',
  '6': 'OTC（8%）',
  '7': '居宅管理療養費',
  '8': '患者負担送料',
  '9': 'レジ袋',
  '10': '補聴器本体',
  '11': '補聴器備品',
};

export const isToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const arrToPieces = (arr: unknown[], n: number) => {
  return [...Array(Math.ceil(arr.length / n))].reduce((acc, _, idx) => {
    acc.push(arr.slice(n * idx, n * (idx + 1)));
    return acc;
  }, []);
};

export const isNum = (n: unknown) => (typeof n === 'string' || typeof n === 'number') && !isNaN(Number(n));

export const createId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
};
