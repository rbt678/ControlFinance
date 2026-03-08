export interface OFXHeader {
  version: string;
  encoding: string;
  charset: string;
  security: string;
}

export interface OFXAccountInfo {
  bankId?: string;
  branchId?: string;
  acctId: string;
  acctType: 'CHECKING' | 'SAVINGS' | 'CREDITCARD';
  org?: string;
  fid?: string;
  currency: string;
}

export interface OFXTransaction {
  id: string; // FITID - unique identifier
  type: 'CREDIT' | 'DEBIT';
  date: string; // ISO date string
  amount: number;
  memo: string;
  fitId: string;
  accountId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDITCARD';
  rawDate: string; // Original OFX date
}

export interface OFXBalance {
  amount: number;
  asOfDate: string;
}

export interface OFXExtraBalance {
  name: string;
  description: string;
  type: string;
  value: number;
}

export interface ParsedOFX {
  fileName: string;
  header: OFXHeader;
  serverDate: string;
  language: string;
  account: OFXAccountInfo;
  transactions: OFXTransaction[];
  ledgerBalance: OFXBalance;
  extraBalances: OFXExtraBalance[];
  dateRange: { start: string; end: string };
  rawContent: string;
}

function extractTag(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function parseOFXDate(dateStr: string): string {
  if (!dateStr) return '';
  // Format: 20260302000000[-3:BRT] or 20260308052017[0:GMT]
  const cleaned = dateStr.replace(/\[.*?\]/, '').trim();
  if (cleaned.length < 8) return '';
  const year = cleaned.substring(0, 4);
  const month = cleaned.substring(4, 6);
  const day = cleaned.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function parseHeader(content: string): OFXHeader {
  const getHeaderValue = (key: string): string => {
    const regex = new RegExp(`${key}:(.*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    version: getHeaderValue('VERSION'),
    encoding: getHeaderValue('ENCODING'),
    charset: getHeaderValue('CHARSET'),
    security: getHeaderValue('SECURITY'),
  };
}

function parseTransactions(content: string, accountId: string, accountType: OFXAccountInfo['acctType']): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];
    const type = extractTag(block, 'TRNTYPE') as 'CREDIT' | 'DEBIT';
    const rawDate = extractTag(block, 'DTPOSTED');
    const amount = parseFloat(extractTag(block, 'TRNAMT'));
    const fitId = extractTag(block, 'FITID');
    const memo = extractTag(block, 'MEMO');

    transactions.push({
      id: `${accountId}:${fitId}`,
      type,
      date: parseOFXDate(rawDate),
      amount,
      memo,
      fitId,
      accountId,
      accountType,
      rawDate,
    });
  }

  return transactions;
}

function parseExtraBalances(content: string): OFXExtraBalance[] {
  const balances: OFXExtraBalance[] = [];
  const balRegex = /<BAL>([\s\S]*?)<\/BAL>/gi;
  let match;

  while ((match = balRegex.exec(content)) !== null) {
    const block = match[1];
    balances.push({
      name: extractTag(block, 'NAME'),
      description: extractTag(block, 'DESC'),
      type: extractTag(block, 'BALTYPE'),
      value: parseFloat(extractTag(block, 'VALUE') || '0'),
    });
  }

  return balances;
}

export function parseOFX(content: string, fileName: string): ParsedOFX {
  const header = parseHeader(content);
  const serverDate = parseOFXDate(extractTag(content, 'DTSERVER'));
  const language = extractTag(content, 'LANGUAGE');
  const org = extractTag(content, 'ORG');
  const fid = extractTag(content, 'FID');
  const currency = extractTag(content, 'CURDEF');

  // Detect account type
  let isCreditCard = content.includes('<CREDITCARDMSGSRSV1>');
  const acctId = extractTag(content, 'ACCTID');

  // Manual overrides
  if (acctId === '5e586deb-3875-476d-b06b-37ff54dabbc4') {
    isCreditCard = true;
  } else if (acctId === '34674923-9' || acctId === '346749239') {
    isCreditCard = false;
  }

  let account: OFXAccountInfo;
  let acctType: OFXAccountInfo['acctType'];

  if (isCreditCard) {
    acctType = 'CREDITCARD';
    account = { acctId, acctType, org, fid, currency };
  } else {
    const bankId = extractTag(content, 'BANKID');
    const branchId = extractTag(content, 'BRANCHID');
    const rawAcctType = extractTag(content, 'ACCTTYPE');
    // Force CHECKING if override matches
    if (acctId === '34674923-9' || acctId === '346749239') {
      acctType = 'CHECKING';
    } else {
      acctType = rawAcctType === 'SAVINGS' ? 'SAVINGS' : 'CHECKING';
    }
    account = { bankId, branchId, acctId, acctType, org, fid, currency };
  }

  const transactions = parseTransactions(content, account.acctId, acctType);

  const ledgerBalAmt = extractTag(content, 'BALAMT');
  const ledgerBalDate = extractTag(content, 'DTASOF');
  const ledgerBalance: OFXBalance = {
    amount: parseFloat(ledgerBalAmt || '0'),
    asOfDate: parseOFXDate(ledgerBalDate),
  };

  const extraBalances = parseExtraBalances(content);

  const dtStart = extractTag(content, 'DTSTART');
  const dtEnd = extractTag(content, 'DTEND');

  return {
    fileName,
    header,
    serverDate,
    language,
    account,
    transactions,
    ledgerBalance,
    extraBalances,
    dateRange: { start: parseOFXDate(dtStart), end: parseOFXDate(dtEnd) },
    rawContent: content,
  };
}
